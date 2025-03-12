// Define the scenarios
export const v2pScenarios = [
    'Vehicle in control contacts person involved in the task',
    'Vehicle in control contacts person not involved in the task',
    'Vehicle not in control / moves unexpectedly contacting person including rollaway',
    'Person in footprint of vehicle including rollaway',
    'Merging, overtaking, path crossover, junction, intersection crossover',
    'Head-on, dove tailing, rear end, blind approach',
];

export const v2vScenarios = [
    'Collision between two vehicles at an intersection or junction',
    'Rear-end collision due to sudden braking or inattention',
    'Side-swipe collision while merging or changing lanes',
    'Head-on collision due to wrong-way entry or overtaking misjudgment',
    'T-bone collision at a crossroad or stop sign violation',
];


export const v2eScenarios = [
    'Vehicle impacts stationary object (barrier, bollard, tree, pole)',
    'Vehicle collides with building or site infrastructure',
    'Vehicle leaves the roadway and enters an exclusion zone',
    'Vehicle skids or loses control due to environmental conditions',
];

export const allDEMs = {
    'Vehicle to person': v2pScenarios,
    'Vehicle to vehicle': v2vScenarios,
    'Vehicle to environment': v2eScenarios
} as const;

// Restructured equipment data to support hierarchical treemap without 'description'
export const equipment = [
    {
        name: "Passenger",
        children: [
            {name: "Light Vehicles"},
            {name: "High Occupancy Vehicles"}
        ]
    },
    {
        name: "Highway Goods Vehicle",
        children: [
            {name: "Road going and road used"}
        ]
    },
    {
        name: "Non Heavy Mobile Equipment",
        children: [
            {name: "Road going but not normally road used"},
            {name: "Operational Vehicles"}
        ]
    },
    {
        name: "Heavy Mobile Equipment",
        children: [
            {name: "Rubber Tyre Heavy Vehicle"},
            {name: "Tracked Heavy Vehicle"}
        ]
    },
];

const nonMiningEquipment = equipment;
const offsiteEquipment = equipment;
const surfaceEquipment = equipment;
const undergroundEquipment = equipment;

export const operatingContext = [
    {name: 'Non-mining onsite', children: nonMiningEquipment},
    {name: 'Offsite', children: offsiteEquipment},
    {name: 'Surface', children: surfaceEquipment},
    {name: 'Underground', children: undergroundEquipment},
];

export const sampleData = {
    name: "Operating Context",
    children: [
        {
            name: "Non-mining onsite",
            children: mapEquipmentToDEMs()
        },
        {
            name: "Offsite",
            children: mapEquipmentToDEMs()
        },
        {
            name: "Surface",
            children: mapEquipmentToDEMs()
        },
        {
            name: "Underground",
            children: mapEquipmentToDEMs()
        }
    ]
};

function mapEquipmentToDEMs() {
    return equipment.map(equip => ({
        ...equip,
        children: equip.children.map(subEquip => ({
            ...subEquip,
            children: Object.entries(allDEMs).map(([dem, scenarios]) => ({
                name: dem,
                children: scenarios.map(scenario => ({name: scenario})),
                value: 1
            }))
        }))
    }));
}

type DEMKey = keyof typeof allDEMs;

interface EquipmentChild {
    name: string;
    selected?: boolean;
}

interface EquipmentItem {
    name: string;
    selected?: boolean;
    children: EquipmentChild[];
}

interface Context {
    name: string;
    children: EquipmentItem[];
}

export function createStructuredRiskTitleData(
    riskTitle: string,
    selectedContexts: string[],
    selectedEquipmentData: EquipmentItem[],
    selectedScenarios: string[]
): { name: string; children: Context[] } {
    return {
        name: riskTitle, // Root object name
        children: operatingContext
            .filter((context) => selectedContexts.includes(context.name)) // Filter selected contexts
            .map((context) => ({
                name: context.name, // Ensure context appears only once
                children: context.children
                    .filter((equip) =>
                        selectedEquipmentData.some(
                            (item) => item.name === equip.name && item.selected
                        )
                    ) // Filter selected equipment
                    .map((equip) => ({
                        name: equip.name,
                        children: equip.children
                            .filter((subEquip) =>
                                selectedEquipmentData.some((parent) =>
                                    parent.name === equip.name &&
                                    parent.children.some(
                                        (child) =>
                                            child.name === subEquip.name && child.selected
                                    )
                                )
                            ) // Filter selected sub-equipment
                            .map((subEquip) => ({
                                name: subEquip.name,
                                children: Object.entries(allDEMs) // Go through all DEMs
                                    .filter(
                                        ([dem]) =>
                                            selectedScenarios.includes(dem as DEMKey) ||
                                            allDEMs[dem as DEMKey].some((scenario) =>
                                                selectedScenarios.includes(scenario)
                                            )
                                    ) // Ensure selected DEMs
                                    .map(([dem, scenarios]) => ({
                                        name: dem,
                                        children: scenarios
                                            .filter((scenario) =>
                                                selectedScenarios.includes(scenario)
                                            ) // Only include selected scenarios
                                            .map((scenario) => ({
                                                name: scenario,
                                                value: 1,
                                            })),
                                    })),
                            })),
                    })),
            })),
    };
}
