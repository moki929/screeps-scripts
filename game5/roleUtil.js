const { cpuExceedsLimit } = require('util');
const { ROLES } = require('constants');

function isEmpty(creep) {
    return creep.store[RESOURCE_ENERGY] === 0;
}

function isFull(creep) {
    return creep.store.getFreeCapacity() === 0;
}

function getSource(creep, sourceIndex = 0) {
    const sources = creep.room.find(FIND_SOURCES);
    const source = sources[sourceIndex];

    if (source.energy === 0) {
        return null;
    }

    return sources[sourceIndex];
}

function sortByPath(creep, targets) {
    let targetsPathLength = [];

    if (cpuExceedsLimit()) {
        return targets.map(target => Game.getObjectById(target.id));
    }

    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        targetsPathLength.push({
            target,
            // Sucks CPU
            pathLength: creep.pos.findPathTo(targets[i]).length
        });
    }

    targetsPathLength.sort((a, b) => a.pathLength - b.pathLength);
    return targetsPathLength.map(t => Game.getObjectById(t.target.id));
}

function harvest(creep, pathColor = 'yellow') {
    let sourceIndex = 1;

    try {
        if (creep.memory.type === 'Woodhouse') {
            sourceIndex = 0;
        }
    } catch (error) {
        console.log('Error while accessing creep role.');
        console.log(error.stack);
    }

    const source = getSource(creep, sourceIndex);

    if (source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
        creep.moveTo(source, {
            visualizePathStyle: { stroke: pathColor }
        });
    }
}

function store(creep) {
    let structureFilter = structure =>
        structure.structureType === STRUCTURE_EXTENSION ||
        structure.structureType === STRUCTURE_SPAWN;

    if (creep.memory.type === 'Alfred') {
        structureFilter = structure =>
            structure.structureType === STRUCTURE_CONTAINER;
    }

    let targets = creep.room.find(FIND_STRUCTURES, {
        filter: structure => {
            return (
                structureFilter(structure) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            );
        }
    });

    // Containers are full
    if (creep.memory.type === 'Alfred' && targets.length === 0) {
        targets = creep.room.find(FIND_STRUCTURES, {
            filter: structure => {
                return (
                    (structure.structureType === STRUCTURE_EXTENSION ||
                        structure.structureType === STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                );
            }
        });
    }

    const closestTargets = sortByPath(creep, targets);

    if (closestTargets.length > 0) {
        // creep.say('🔋store');
        creep.memory.storing = true;
        if (
            creep.transfer(closestTargets[0], RESOURCE_ENERGY) ===
            ERR_NOT_IN_RANGE
        ) {
            creep.moveTo(closestTargets[0], {
                visualizePathStyle: { stroke: 'white' }
            });
        }
    }
}

function withdraw(creep, pathColor = 'yellow') {
    const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: structure => {
            return (
                structure.structureType === STRUCTURE_CONTAINER &&
                structure.store[RESOURCE_ENERGY] > 0
            );
        }
    });

    if (
        container &&
        creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
        creep.moveTo(container, {
            visualizePathStyle: { stroke: pathColor }
        });
    }
}

function build(creep) {
    const target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
    if (target) {
        if (creep.build(target) === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, {
                visualizePathStyle: { stroke: ROLES.builder.color }
            });
        }
    }
}

module.exports = {
    isEmpty,
    isFull,
    harvest,
    store,
    withdraw,
    build,
    sortByPath
};
