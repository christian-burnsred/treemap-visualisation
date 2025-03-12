import * as d3 from 'd3';
import {useEffect, useRef, useState} from "react";

// Define a type for the data structure
interface TreemapData {
    name: string;
    value?: number;
    children?: TreemapData[];
}

// Define our custom node type that extends D3's hierarchy node
interface TreemapNode extends d3.HierarchyRectangularNode<TreemapData> {
    nodeId: string;
    clipId: string;
}

interface NestedTreemapProps {
    data: TreemapData;
    title?: string;
    maxDepth?: number; // New parameter to control display depth
}

const NestedTreemap = ({
                           data,
                           title = "Vehicle Incident",
                           maxDepth = Infinity, // Default to show all levels
                       }: NestedTreemapProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = useState({width: 0, height: 0});
    const [currentRoot, setCurrentRoot] = useState<d3.HierarchyNode<TreemapData> | null>(null);

    // Store the full hierarchy for reference
    const fullHierarchyRef = useRef<d3.HierarchyNode<TreemapData> | null>(null);

    // Define highlight color for interactive elements
    const HIGHLIGHT_COLOR = "#DD6B20";

    // Define node category labels based on depth
    const NODE_CATEGORIES = [
        "Risk",
        "Operating Context",
        "Equipment Level 1",
        "Equipment Level 2",
        "Damaging Energy Mechanism",
        "Scenario"
    ];

    // Resize observer to make the treemap responsive
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (!entries.length) return;

            const {width, height} = entries[0].contentRect;
            setDimensions({
                width: Math.max(width, 100),  // Ensure minimum dimensions
                height: Math.max(height, 100),
            });
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Initialize hierarchy when data changes
    useEffect(() => {
        if (!data) return;

        const hierarchy = d3.hierarchy(data)
            .sum(d => d.value || 0)
            .sort((a, b) => (b.value || 0) - (a.value || 0));

        fullHierarchyRef.current = hierarchy;
        setCurrentRoot(hierarchy);
    }, [data]);

    // D3 treemap rendering logic
    useEffect(() => {
        if (
            !svgRef.current ||
            dimensions.width === 0 ||
            dimensions.height === 0 ||
            !data ||
            !currentRoot
        ) return;

        const {width, height} = dimensions;

        // Clear previous content
        d3.select(svgRef.current).selectAll("*").remove();

        // Check if the total value is 0 - display message if it is
        if (currentRoot.value === 0) {
            // Create the SVG container with increased header height for title
            const headerHeight = 45;
            const svg = d3.select(svgRef.current)
                .attr("viewBox", [0, -headerHeight, width, height + headerHeight])
                .attr("width", "100%")
                .attr("height", "100%")
                .style("font", "10px sans-serif");

            // Add the main title group
            const titleGroup = svg.append("g")
                .attr("class", "title-group")
                .attr("transform", `translate(0, -${headerHeight})`);

            // Add the main title text
            titleGroup.append("text")
                .attr("x", 0)
                .attr("y", 15)
                .attr("font-size", "16px")
                .attr("font-weight", "bold")
                .attr("fill", HIGHLIGHT_COLOR)
                .attr("class", "main-title")
                .text(title);

            // Add message for empty data
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "16px")
                .attr("fill", "#666")
                .text("Add at least one scenarios, operating context, and equipment to display the interactive model.");

            return;
        }

        // Color scale for different tree depths
        const color = d3.scaleSequential([0, 9], d3.interpolateOranges);

        // Create a new hierarchy from the current root to ensure proper values
        const currentHierarchy = d3.hierarchy(currentRoot.data)
            .sum(d => d.value || 0)
            .sort((a, b) => (b.value || 0) - (a.value || 0));

        // Create a treemap layout
        const treemap = d3.treemap<TreemapData>()
            .size([width, height])
            .paddingOuter(3)
            .paddingTop(19)
            .paddingInner(1)
            .round(true);

        // Apply the treemap layout
        const root = treemap(currentHierarchy);

        // Calculate the effective depth for display
        // Find the depth of the current root
        const rootDepth = root.depth;

        // Filter nodes based on maxDepth - keep only nodes within the specified depth range
        const visibleNodes = root.descendants().filter(node => {
            // Always show the current root node
            if (node === root) return true;

            // Calculate the relative depth from the current root
            const relativeDepth = node.depth - rootDepth;

            // Show nodes that are within the maxDepth limit
            return relativeDepth <= maxDepth;
        });

        // Extend nodes with our custom properties
        const nodes = visibleNodes.map(node => {
            return Object.assign(node, {
                nodeId: `node-${Math.random().toString(36).substring(2, 11)}`,
                clipId: `clip-${Math.random().toString(36).substring(2, 11)}`
            }) as TreemapNode;
        });

        // Create the SVG container with increased header height for title and navigation
        const headerHeight = 45;
        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, -headerHeight, width, height + headerHeight])
            .attr("width", "100%")
            .attr("height", "100%")
            .style("font", "10px sans-serif");

        // Create unique ID for shadow
        const shadowId = `shadow-${Math.random().toString(36).substring(2, 11)}`;

        // Add definitions for shadow filter
        svg.append("defs")
            .append("filter")
            .attr("id", shadowId)
            .append("feDropShadow")
            .attr("flood-opacity", 0.3)
            .attr("dx", 0)
            .attr("stdDeviation", 3);

        // Add the main title group
        const titleGroup = svg.append("g")
            .attr("class", "title-group")
            .attr("transform", `translate(0, -${headerHeight})`);

        // Add the main title text
        titleGroup.append("text")
            .attr("x", 0)
            .attr("y", 15)
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .attr("fill", HIGHLIGHT_COLOR)
            .attr("class", "main-title")
            .text(title)

        // Add the path container for breadcrumb navigation
        const pathContainer = titleGroup.append("g")
            .attr("class", "path-container")
            .attr("transform", "translate(0, 35)");

        // Collect ancestors for breadcrumb
        const updateBreadcrumb = () => {
            pathContainer.selectAll("*").remove();

            if (currentRoot === fullHierarchyRef.current) {
                // Add instructions when at the root level (no breadcrumb path)
                pathContainer.append("text")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("font-size", "12px")
                    .attr("fill", "#666")
                    .attr("font-style", "italic")
                    .text("Click on a node to navigate the model or hover on the node to show its category");

                return;
            }

            // Find path from root to current node
            const findPathToNode = (node: d3.HierarchyNode<TreemapData> | null, target: d3.HierarchyNode<TreemapData>, path: d3.HierarchyNode<TreemapData>[]) => {
                if (!node) return false;

                path.push(node);

                if (node.data === target.data) return true;

                if (node.children) {
                    for (const child of node.children) {
                        if (findPathToNode(child, target, path)) return true;
                    }
                }

                path.pop();
                return false;
            };

            const path: d3.HierarchyNode<TreemapData>[] = [];

            if (fullHierarchyRef.current && currentRoot) {
                findPathToNode(fullHierarchyRef.current, currentRoot, path);
            }

            // Draw breadcrumbs
            let xOffset = 0;
            path.forEach((ancestor, i) => {
                if (i === path.length - 1) return; // Skip current node in breadcrumb

                // Add breadcrumb segment
                const segment = pathContainer.append("text")
                    .attr("x", xOffset)
                    .attr("y", 0)
                    .attr("fill", "#666")
                    .attr("font-size", "12px")
                    .text(i === 0 ? ancestor.data.name : ancestor.data.name)
                    .attr("cursor", "pointer")
                    .on("mouseover", function () {
                        d3.select(this).style("text-decoration", "underline");
                        d3.select(this).style("fill", HIGHLIGHT_COLOR);
                    })
                    .on("mouseout", function () {
                        d3.select(this).style("text-decoration", "none");
                        d3.select(this).style("fill", "#666");
                    })
                    .on("click", () => {
                        setCurrentRoot(ancestor);
                    });

                // Calculate segment width
                const bbox = segment.node()?.getBBox();
                xOffset += (bbox?.width || 0);

                // Add separator if not the last element
                if (i < path.length - 2) {
                    const separator = pathContainer.append("text")
                        .attr("x", xOffset)
                        .attr("y", 0)
                        .attr("font-size", "12px")
                        .attr("fill", "#666")
                        .text("\u00A0/\u00A0"); // Space around separator

                    const sepBox = separator.node()?.getBBox();
                    xOffset += (sepBox?.width || 0);
                }
            });
        };

        // Call the breadcrumb updater
        updateBreadcrumb();

        // Create a group for the treemap content
        const contentGroup = svg.append("g");

        // Group nodes by their depth
        const grouped = Array.from(d3.group(nodes, d => d.height));

        const node = contentGroup.selectAll<SVGGElement, [number, TreemapNode[]]>(".depth-group")
            .data(grouped)
            .join("g")
            .attr("class", "depth-group")
            .selectAll<SVGGElement, TreemapNode>(".node")
            .data(d => d[1])
            .join("g")
            .attr("class", "node")
            .attr("filter", `url(#${shadowId})`)
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        const format = d3.format(",d");

        // Modified tooltip to only show the category
        node.append("title")
            .text(d => {
                // Find the absolute depth of the node from the root of the full hierarchy
                const absoluteDepth = d.depth;

                // Get the corresponding category based on depth
                return NODE_CATEGORIES[absoluteDepth] || "Category";
            });

        // Add rectangles for each node with click behavior for zooming
        const zoomToNode = (d: TreemapNode) => {
            if (d.children && d.children.length > 0) {
                // Find the matching node in the full hierarchy
                const findNode = (searchNode: d3.HierarchyNode<TreemapData>, targetData: TreemapData): d3.HierarchyNode<TreemapData> | null => {
                    if (searchNode.data === targetData) {
                        return searchNode;
                    }

                    if (searchNode.children) {
                        for (const child of searchNode.children) {
                            const result = findNode(child, targetData);
                            if (result) return result;
                        }
                    }

                    return null;
                };

                if (fullHierarchyRef.current) {
                    const targetNode = findNode(fullHierarchyRef.current, d.data);
                    if (targetNode) {
                        setCurrentRoot(targetNode);
                    }
                }
            }
        };

        node.append("rect")
            .attr("id", d => d.nodeId)
            .attr("fill", d => color(d.height))
            .attr("width", d => Math.max(0, d.x1 - d.x0))
            .attr("height", d => Math.max(0, d.y1 - d.y0))
            .attr("cursor", d => d.children ? "pointer" : "default")
            .on("click", (event, d) => {
                event.stopPropagation();
                zoomToNode(d);
            });

        node.append("clipPath")
            .attr("id", d => d.clipId)
            .append("use")
            .attr("href", d => `#${d.nodeId}`);

        // Helper function to wrap text in SVG
        function wrapText(selection: d3.Selection<SVGTextElement, any, any, any>, width: number) {
            selection.each(function () {
                const text = d3.select(this);
                const words = text.text().split(/\s+/).reverse();
                const lineHeight = 1.1; // ems
                const y = text.attr("y");
                const x = text.attr("x");
                const dy = parseFloat(text.attr("dy") || "0");

                let word;
                let line: string[] = [];
                let lineNumber = 0;
                let tspan = text.text(null).append("tspan")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("dy", dy + "em");

                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node()!.getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
                    }
                }
            });
        }

        // Add text for nodes based on visibility and depth
        node.append("text")
            .attr("clip-path", d => `url(#${d.clipId})`)
            .attr("x", 3)
            .attr("y", 13)
            .attr("cursor", d => d.children ? "pointer" : "normal")
            .attr("font-weight", d => d.children ? "bold" : "normal")
            .text(d => {
                // Check if this is a leaf node in the original hierarchy
                const isActualLeafNode = !d.children && !d.data.children;

                // For actual leaf nodes, just show the name
                if (isActualLeafNode) {
                    return `${d.data.name}`;
                }

                // For all other nodes (parent nodes and nodes at max depth), show name with value
                return `${d.data.name} (${format(d.value || 0)})`;
            })
            .each(function (d) {
                // Apply text wrapping for leaf nodes and max depth nodes
                const isAtMaxDepth = (d.depth - rootDepth) === maxDepth && d.children;
                const isActualLeafNode = !d.children && !d.data.children;

                if (isActualLeafNode || isAtMaxDepth) {
                    // Calculate available width for wrapping
                    const availableWidth = Math.max(0, d.x1 - d.x0) - 6; // 6px padding
                    wrapText(d3.select(this), availableWidth);
                }
            })
            .on("click", (event, d) => {
                event.stopPropagation();
                zoomToNode(d);
            });

    }, [data, dimensions, currentRoot, title, maxDepth]); // Include maxDepth in dependencies

    return (
        <div ref={containerRef} style={{width: '100%', height: '100%'}}>
            <svg ref={svgRef} style={{width: '100%', height: '100%'}}/>
        </div>
    );
};

export default NestedTreemap;