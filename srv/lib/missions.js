import cds from "@sap/cds";

import {
    calculateNavigationSkill,
} from "./progression.js";

const { SELECT, INSERT, UPDATE } = cds.ql;

export async function startMission({
    db,
    spacefarerId,
    missionId,
}) {
    const {
        Spacefarers,
        Missions,
        SpacefarerMissions,
    } = cds.entities("galactic.spacefarer");

    // Ellenőrizzük, hogy a Spacefarer valóban létezik-e.
    const spacefarer = await db.run(
        SELECT.one
            .from(Spacefarers)
            .where({ ID: spacefarerId })
    );

    if (!spacefarer) {
        throw Object.assign(
            new Error(`Spacefarer not found: ${spacefarerId}`),
            { status: 404 }
        );
    }

    // A Mission adatait mindig a backend olvassa ki.
    const mission = await db.run(
        SELECT.one
            .from(Missions)
            .where({ ID: missionId })
    );

    if (!mission) {
        throw Object.assign(
            new Error(`Mission not found: ${missionId}`),
            { status: 404 }
        );
    }

    const startedAt = new Date();

    const completesAt = new Date(
        startedAt.getTime() + mission.durationSeconds * 1000
    );

    const entry = {
        spacefarer_ID: spacefarerId,
        mission_ID: missionId,
        startedAt: startedAt.toISOString(),
        completesAt: completesAt.toISOString(),
        rewardClaimedAt: null,
    };

    const result = await db.run(
        INSERT.into(SpacefarerMissions).entries(entry)
    );

    const [createdMission] = [...result];

    return {
        ...entry,
        ID: createdMission.ID,
    };
}

export async function claimMissionReward({
    db,
    spacefarerMissionId,
}) {
    const {
        Spacefarers,
        Missions,
        SpacefarerMissions,
    } = cds.entities("galactic.spacefarer");

    // Betöltjük a konkrét mission futást.
    const spacefarerMission = await db.run(
        SELECT.one
            .from(SpacefarerMissions)
            .where({ ID: spacefarerMissionId })
    );

    if (!spacefarerMission) {
        throw Object.assign(
            new Error(`Spacefarer mission not found: ${spacefarerMissionId}`),
            { status: 404 }
        );
    }

    // Már felvett jutalmat nem lehet újra felvenni.
    if (spacefarerMission.rewardClaimedAt) {
        throw Object.assign(
            new Error("Mission reward has already been claimed."),
            { status: 409 }
        );
    }

    const now = new Date();
    const completesAt = new Date(spacefarerMission.completesAt);

    // Mindig a szerver ideje alapján döntjük el, hogy lejárt-e a mission.
    if (now < completesAt) {
        throw Object.assign(
            new Error("Mission is still in progress."),
            { status: 409 }
        );
    }

    // A reward értékét nem a klienstől fogadjuk el,
    // hanem a Mission master adatból olvassuk ki.
    const mission = await db.run(
        SELECT.one
            .from(Missions)
            .where({ ID: spacefarerMission.mission_ID })
    );

    if (!mission) {
        throw new Error(
            `Mission definition not found: ${spacefarerMission.mission_ID}`
        );
    }

    const spacefarer = await db.run(
        SELECT.one
            .from(Spacefarers)
            .where({ ID: spacefarerMission.spacefarer_ID })
    );

    if (!spacefarer) {
        throw new Error(
            `Spacefarer not found: ${spacefarerMission.spacefarer_ID}`
        );
    }

    /*
     * Nem elég csak előtte ellenőrizni a rewardClaimedAt mezőt.
     * A feltételes UPDATE megakadályozza, hogy két majdnem egyszerre
     * érkező claim request ugyanazt a rewardot kétszer adja oda.
     */
    const affectedRows = await db.run(
        UPDATE(SpacefarerMissions)
            .set({
                rewardClaimedAt: now.toISOString(),
            })
            .where({
                ID: spacefarerMissionId,
                rewardClaimedAt: null,
            })
    );

    if (affectedRows === 0) {
        throw Object.assign(
            new Error("Mission reward has already been claimed."),
            { status: 409 }
        );
    }

        const newNavigationXp =
            (spacefarer.wormholeNavigationXp ?? 0) +
            mission.navigationXpReward;

        const newNavigationSkill =
            calculateNavigationSkill(newNavigationXp);

        await db.run(
            UPDATE(Spacefarers)
                .set({
                    wormholeNavigationXp: newNavigationXp,
                    wormholeNavigationSkill: newNavigationSkill,
                })
                .where({ ID: spacefarer.ID })
        );

        return db.run(
            SELECT.one
                .from(Spacefarers)
                .where({ ID: spacefarer.ID })
        );
}