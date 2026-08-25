import cds from "@sap/cds";

const { SELECT, INSERT } = cds.ql;

export const ACHIEVEMENT_CODES = {
    FIRST_LAUNCH: "FIRST_LAUNCH",
    STARDUST_COLLECTOR: "STARDUST_COLLECTOR",
    GALACTIC_ELITE: "GALACTIC_ELITE",
    WORMHOLE_ROOKIE: "WORMHOLE_ROOKIE",
    WORMHOLE_MASTER: "WORMHOLE_MASTER",
    FIRST_MISSION: "FIRST_MISSION",
    VETERAN_EXPLORER: "VETERAN_EXPLORER",
    MISSION_SPECIALIST: "MISSION_SPECIALIST",
    COSMIC_VETERAN: "COSMIC_VETERAN",
    ALDI_ASTRONAUT: "ALDI_ASTRONAUT",
};

export async function unlockAchievement({
    db,
    spacefarerId,
    code,
}) {
    const {
        Achievements,
        SpacefarerAchievements,
    } = cds.entities("galactic.spacefarer");

    const achievement = await db.run(
        SELECT.one
            .from(Achievements)
            .where({ code })
    );

    if (!achievement) {
        throw new Error(`Achievement not found: ${code}`);
    }

    const existingUnlock = await db.run(
        SELECT.one
            .from(SpacefarerAchievements)
            .where({
                spacefarer_ID: spacefarerId,
                achievement_ID: achievement.ID,
            })
    );

    if (existingUnlock) {
        return false;
    }

    await db.run(
        INSERT.into(SpacefarerAchievements).entries({
            spacefarer_ID: spacefarerId,
            achievement_ID: achievement.ID,
            unlockedAt: new Date().toISOString(),
        })
    );

    return true;
}

export async function evaluateAchievements({
    db,
    spacefarerId,
}) {
    const {
        Spacefarers,
        SpacefarerMissions,
        SpacefarerAchievements,
    } = cds.entities("galactic.spacefarer");

    const spacefarer = await db.run(
        SELECT.one
            .from(Spacefarers)
            .where({ ID: spacefarerId })
    );

    if (!spacefarer) {
        throw new Error(`Spacefarer not found: ${spacefarerId}`);
    }

    const completedMissions = await db.run(
        SELECT.from(SpacefarerMissions)
            .columns(
                "mission_ID",
                "rewardClaimedAt"
            )
            .where({
                spacefarer_ID: spacefarerId,
            })
    );

    const claimedMissions = completedMissions.filter(
        (mission) => mission.rewardClaimedAt !== null
    );

    const achievementsToUnlock = [];

    if (spacefarer.stardustCollection >= 250) {
        achievementsToUnlock.push(
            ACHIEVEMENT_CODES.STARDUST_COLLECTOR
        );
    }

    if (spacefarer.stardustCollection >= 1000) {
        achievementsToUnlock.push(
            ACHIEVEMENT_CODES.GALACTIC_ELITE
        );
    }

    if (spacefarer.wormholeNavigationXp >= 100) {
        achievementsToUnlock.push(
            ACHIEVEMENT_CODES.WORMHOLE_ROOKIE
        );
    }

    if (spacefarer.wormholeNavigationXp >= 1000) {
        achievementsToUnlock.push(
            ACHIEVEMENT_CODES.WORMHOLE_MASTER
        );
    }

    if (
        spacefarer.stardustCollection >= 500 &&
        spacefarer.wormholeNavigationSkill >= 75
    ) {
        achievementsToUnlock.push(
            ACHIEVEMENT_CODES.COSMIC_VETERAN
        );
    }

    if (claimedMissions.length >= 1) {
        achievementsToUnlock.push(
            ACHIEVEMENT_CODES.FIRST_MISSION
        );
    }

    if (claimedMissions.length >= 5) {
        achievementsToUnlock.push(
            ACHIEVEMENT_CODES.VETERAN_EXPLORER
        );
    }

    const distinctMissionIds = new Set(
        claimedMissions.map(
            (mission) => mission.mission_ID
        )
    );

    if (distinctMissionIds.size >= 3) {
        achievementsToUnlock.push(
            ACHIEVEMENT_CODES.MISSION_SPECIALIST
        );
    }

    for (const code of achievementsToUnlock) {
        await unlockAchievement({
            db,
            spacefarerId,
            code,
        });
    }
    const unlockedAchievements = await db.run(
        SELECT.from(SpacefarerAchievements)
            .columns("achievement_ID")
            .where({
                spacefarer_ID: spacefarerId,
            })
    );

    if (unlockedAchievements.length >= 9) {
        await unlockAchievement({
            db,
            spacefarerId,
            code: ACHIEVEMENT_CODES.ALDI_ASTRONAUT,
        });
    }
}