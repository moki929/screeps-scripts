const {
    getCreepsFromRole,
    capitalize,
    printBodyCostForRoles
} = require('util');
const constants = require('constants');
const { ROLES, HP, ...selectedConstants } = constants;
const { GRANDS_TRAVAUX, MAX_BUILDERS_GRANDS_TRAVAUX } = constants;

function gameInfo(reportAll = false) {
    try {
        if (reportAll) {
            console.log(`Constants: ${JSON.stringify(selectedConstants)}`);
            printBodyCostForRoles();
        }

        if (!Memory.rooms) {
            Memory.rooms = {};
        }

        for (const roomName in Game.rooms) {
            if (!Memory.rooms[roomName]) {
                Memory.rooms[roomName] = {
                    energy: 0,
                    sites: 0
                };
            }

            const energyAvailable = Game.rooms[roomName].energyAvailable;
            const energyCapacity = Game.rooms[roomName].energyCapacityAvailable;
            if (
                reportAll ||
                Memory.rooms[roomName].energy !== energyAvailable ||
                Memory.rooms[roomName].energyCapacity !== energyCapacity
            ) {
                const diff =
                    reportAll ||
                    (Memory.rooms[roomName].energy || 0) - energyAvailable;
                Memory.rooms[roomName].energy = energyAvailable;
                if (
                    diff === true ||
                    Memory.rooms[roomName].energyCapacity !== energyCapacity ||
                    energyAvailable % 10 === 0 ||
                    diff >= 10 ||
                    diff <= -10
                ) {
                    console.log(
                        `Energy in room ${roomName}: ${Memory.rooms[roomName].energy}/${energyCapacity}`
                    );
                }
                Memory.rooms[roomName].energyCapacity = energyCapacity;
            }

            const availableEnergyStores = Game.rooms[roomName].find(
                FIND_STRUCTURES,
                {
                    filter: structure => {
                        return (
                            (structure.structureType === STRUCTURE_EXTENSION ||
                                structure.structureType === STRUCTURE_SPAWN) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                        );
                    }
                }
            );

            if (!Memory.rooms[roomName].availableEnergyStores) {
                Memory.rooms[roomName].availableEnergyStores = [];
            }

            if (
                reportAll ||
                Memory.rooms[roomName].availableEnergyStores.length !==
                    availableEnergyStores.length
            ) {
                Memory.rooms[
                    roomName
                ].availableEnergyStores = availableEnergyStores;
                console.log(
                    `Available energy stores in room ${roomName}: ${Memory.rooms[roomName].availableEnergyStores.length}`
                );
            }

            if (!Memory.rooms[roomName].sites) {
                Memory.rooms[roomName].sites = [];
            }

            const sites = Game.rooms[roomName].find(FIND_MY_CONSTRUCTION_SITES);
            if (
                reportAll ||
                Memory.rooms[roomName].sites.length !== sites.length
            ) {
                Memory.rooms[roomName].sites = sites;
                console.log(
                    `Construction sites in room ${roomName}: ${
                        Memory.rooms[roomName].sites.length
                    } (grands travaux: ${sites.length >= GRANDS_TRAVAUX})`
                );
            }

            if (!Memory.rooms[roomName].roles) {
                Memory.rooms[roomName].roles = {};
            }

            for (const roleName in ROLES) {
                const role = ROLES[roleName];
                const creeps = getCreepsFromRole(role.name);

                if (
                    reportAll ||
                    Memory.rooms[roomName].roles[`${role.name}s`] !==
                        creeps.length
                ) {
                    Memory.rooms[roomName].roles[`${role.name}s`] =
                        creeps.length;
                    const max =
                        role.name === 'builder' &&
                        Memory.rooms[roomName].sites.length >= GRANDS_TRAVAUX
                            ? MAX_BUILDERS_GRANDS_TRAVAUX
                            : role.max;

                    console.log(
                        `${capitalize(role.name)}s in room ${roomName}: ${
                            Memory.rooms[roomName].roles[`${role.name}s`]
                        }/${max}`
                    );

                    for (let i = 0; i < role.types.length; i++) {
                        if (!Memory.rooms[roomName].types) {
                            Memory.rooms[roomName].types = {};
                        }

                        const type = role.types[i];
                        Memory.rooms[roomName].types[type.name] = creeps.filter(
                            creep => creep.memory.type === type.name
                        ).length;
                        console.log(
                            `- ${type.name} in room ${roomName}: ${
                                Memory.rooms[roomName].types[type.name]
                            }/${Math.ceil(type.ratio * role.max)}`
                        );
                    }
                }
            }
        }
    } catch (error) {
        console.log('Error while printing game info.');
        console.log(error.stack);
    }
}

module.exports = gameInfo;
