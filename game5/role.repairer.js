const builderRoutine = require('role.builder');
const upgraderRoutine = require('role.upgrader');
const { withdraw, isEmpty, isFull } = require('roleUtil');
const { ROLES, HP } = require('constants');

function repairerRoutine(creep) {
    const roomName = creep.room.name;

    if (creep.memory.repairing && isEmpty(creep)) {
        creep.memory.repairing = false;
        creep.say('🔄withdraw');
    }
    if (!creep.memory.repairing && isFull(creep)) {
        creep.memory.repairing = true;
        creep.say('❤️repair');
    }

    if (creep.memory.repairing) {
        const targets = creep.room.find(FIND_STRUCTURES, {
            filter: structure =>
                structure.hits < structure.hitsMax &&
                // Don't repair beyond
                structure.hits < HP.HP_500K
        });
        if (targets.length > 0) {
            if (creep.repair(targets[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], {
                    visualizePathStyle: { stroke: ROLES.repairer.color }
                });
            }
            // Switch task if no tower needs energy
        } else {
            // Construction sites exist
            if (Memory.rooms[roomName].sites.length > 0) {
                builderRoutine(creep);
                return;
            }

            // Default to upgrade control room
            upgraderRoutine(creep);
            return;
        }
    } else {
        withdraw(creep, ROLES.repairer.color);
    }
}

module.exports = repairerRoutine;
