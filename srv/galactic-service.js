import cds from "@sap/cds";

import {
    calculateNavigationSkill,
    calculateStardustStatus,
} from "./lib/progression.js";

import {
    ACHIEVEMENT_CODES,
    evaluateAchievements,
    unlockAchievement,
} from "./lib/achievements.js";

import {
    sendWelcomeNotification,
} from "./lib/notification.js";

import {
    claimMissionReward,
    startMission,
} from "./lib/missions.js";

const { SELECT } = cds.ql;

export default class GalacticSpacefarerService extends cds.ApplicationService {
    async init() {
        
        const {
            Spacefarers,
            SpacefarerMissions,
            SpacefarerAchievements,
            Achievements,
        } = this.entities;

        const db = await cds.connect.to("db");

        const {
            Spacefarers: DbSpacefarers,
            SpacefarerMissions: DbSpacefarerMissions,
        } = cds.entities("galactic.spacefarer");

        this.before("CREATE", Spacefarers, (req) => {
            const data = req.data;

            if (!userCanAccessPlanet(req, data.originPlanet_ID)) {
                return req.reject(
                    403,
                    "You can only create Spacefarers for your own planet."
                );
            }

            validateProgressionValues(req, data);

            // CREATE esetén mindig meghatározzuk a derived mezők kezdeti értékét.
            data.stardustStatus = calculateStardustStatus(
                data.stardustCollection ?? 0
            );

            data.wormholeNavigationSkill = calculateNavigationSkill(
                data.wormholeNavigationXp ?? 0
            );
        });

        this.after("READ", Spacefarers, async (results) => {
            const spacefarers = Array.isArray(results)
                ? results
                : [results];

            for (const spacefarer of spacefarers) {
                if (!spacefarer?.ID) {
                    continue;
                }


                const unlockedAchievements = await SELECT.from(
                    SpacefarerAchievements
                )
                    .columns("ID")
                    .where({
                        spacefarer_ID: spacefarer.ID
                    });

                spacefarer.achievementCount = unlockedAchievements.length;

                const allAchievements = await SELECT.from(
                    Achievements
                ).columns("ID");

                spacefarer.achievementTotal = allAchievements.length;
                spacefarer.achievementProgress = `${spacefarer.achievementCount} / ${spacefarer.achievementTotal}`;
            }
        });

        this.after("READ", SpacefarerMissions, async (results) => {
            const missions = Array.isArray(results)
                ? results
                : [results];

            for (const mission of missions) {
                if (!mission?.ID) {
                    continue;
                }

                const persistedMission = await db.run(
                    SELECT.one
                        .from(DbSpacefarerMissions)
                        .columns(
                            "completesAt",
                            "rewardClaimedAt"
                        )
                        .where({
                            ID: mission.ID,
                        })
                );

                if (!persistedMission) {
                    continue;
                }

                if (persistedMission.rewardClaimedAt) {
                    mission.missionStatus = "Completed";
                    continue;
                }

                if (
                    persistedMission.completesAt &&
                    new Date(persistedMission.completesAt) <= new Date()
                ) {
                    mission.missionStatus = "Ready to Claim";
                    continue;
                }

                mission.missionStatus = "In Progress";
            }
        });

        this.before("UPDATE", Spacefarers, (req) => {
            const data = req.data;

            validateProgressionValues(req, data);

            // PATCH esetén csak akkor számoljuk újra a derived mezőt,
            // ha az alapjául szolgáló érték ténylegesen változik.
            if (data.stardustCollection !== undefined) {
                data.stardustStatus = calculateStardustStatus(
                    data.stardustCollection
                );
            }

            if (data.wormholeNavigationXp !== undefined) {
                data.wormholeNavigationSkill = calculateNavigationSkill(
                    data.wormholeNavigationXp
                );
            }
        });

        this.after("UPDATE", Spacefarers, async (_results, req) => {
            const spacefarerId = req.data.ID;

            if (!spacefarerId) {
                return;
            }

            await evaluateAchievements({
                db,
                spacefarerId,
            });
        });

        this.after("CREATE", Spacefarers, async (results, req) => {
            // CAP 10-ben a CREATE eredménye egy array-szerű objektum.
            // Iterálással kapjuk meg a létrehozott rekord generált kulcsát.
            const [createdSpacefarer] = [...results];

            if (!createdSpacefarer?.ID) {
                throw new Error("Created Spacefarer ID could not be determined.");
            }

            // A First Launch achievement ugyanahhoz a tranzakcióhoz tartozik,
            // mint a Spacefarer létrehozása.
            await unlockAchievement({
                db,
                spacefarerId: createdSpacefarer.ID,
                code: ACHIEVEMENT_CODES.FIRST_LAUNCH,
            });

            await evaluateAchievements({
                db,
                spacefarerId: createdSpacefarer.ID,
            });

            // A request adatai tartalmazzák a létrehozott Spacefarer mezőit,
            // a generált ID-t pedig a CREATE eredményéből vesszük.
            const spacefarer = {
                ...req.data,
                ID: createdSpacefarer.ID,
            };

            // Külső side effectet csak a sikeres commit után végzünk.
            req.on("succeeded", async () => {
                try {
                    await sendWelcomeNotification(spacefarer);
                } catch (error) {
                    console.error(
                        "[Notification] Failed to send welcome email:",
                        error
                    );
                }
            });
        });

        this.on("startMission", async (req) => {
            const {
                spacefarerId,
                missionId,
            } = req.data;

            if (!spacefarerId || !missionId) {
                return req.reject(
                    400,
                    "Spacefarer ID and Mission ID are required."
                );
            }

            const spacefarer = await db.run(
                SELECT.one
                    .from(DbSpacefarers)
                    .where({ ID: spacefarerId })
            );

            if (!spacefarer) {
                return req.reject(
                    404,
                    "Spacefarer not found."
                );
            }

            if (!userCanAccessPlanet(req, spacefarer.originPlanet_ID)) {
                return req.reject(
                    403,
                    "You can only start missions for Spacefarers from your own planet."
                );
            }

            return startMission({
                db,
                spacefarerId,
                missionId,
            });
        });

        this.on("startMissionForSpacefarer", Spacefarers, async (req) => {
            const spacefarerId = req.params?.[0]?.ID;
            const { missionId } = req.data;

            if (!spacefarerId || !missionId) {
                return req.reject(
                    400,
                    "Spacefarer ID and Mission ID are required."
                );
            }

            const spacefarer = await db.run(
                SELECT.one
                    .from(DbSpacefarers)
                    .where({ ID: spacefarerId })
            );

            if (!spacefarer) {
                return req.reject(
                    404,
                    "Spacefarer not found."
                );
            }

            if (!userCanAccessPlanet(req, spacefarer.originPlanet_ID)) {
                return req.reject(
                    403,
                    "You can only start missions for Spacefarers from your own planet."
                );
            }

            return startMission({
                db,
                spacefarerId,
                missionId,
            });
        });

        this.on("claimMissionReward", async (req) => {
            const {
                spacefarerMissionId,
            } = req.data;

            if (!spacefarerMissionId) {
                return req.reject(
                    400,
                    "Spacefarer Mission ID is required."
                );
            }

            const spacefarerMission = await db.run(
                SELECT.one
                    .from(DbSpacefarerMissions)
                    .where({ ID: spacefarerMissionId })
            );

            if (!spacefarerMission) {
                return req.reject(
                    404,
                    "Spacefarer mission not found."
                );
            }

            const spacefarer = await db.run(
                SELECT.one
                    .from(DbSpacefarers)
                    .where({ ID: spacefarerMission.spacefarer_ID })
            );

            if (!spacefarer) {
                return req.reject(
                    404,
                    "Spacefarer not found."
                );
            }

            if (!userCanAccessPlanet(req, spacefarer.originPlanet_ID)) {
                return req.reject(
                    403,
                    "You can only claim mission rewards for Spacefarers from your own planet."
                );
            }

            const updatedSpacefarer = await claimMissionReward({
                db,
                spacefarerMissionId,
            });

            await evaluateAchievements({
                db,
                spacefarerId: updatedSpacefarer.ID,
            });

            return updatedSpacefarer;
        });

        this.on("claimReward", SpacefarerMissions, async (req) => {
            // Compositionön keresztüli bound actionnél több context paraméter is lehet.
            // Nekünk a legbelső, vagyis a konkrét SpacefarerMission kulcsa kell.
            const missionParams = req.params?.[req.params.length - 1];
            const spacefarerMissionId = missionParams?.ID;

            if (!spacefarerMissionId) {
                return req.reject(
                    400,
                    "Spacefarer Mission ID is required."
                );
            }

            const spacefarerMission = await db.run(
                SELECT.one
                    .from(DbSpacefarerMissions)
                    .where({ ID: spacefarerMissionId })
            );

            if (!spacefarerMission) {
                return req.reject(
                    404,
                    "Spacefarer mission not found."
                );
            }

            const spacefarer = await db.run(
                SELECT.one
                    .from(DbSpacefarers)
                    .where({ ID: spacefarerMission.spacefarer_ID })
            );

            if (!spacefarer) {
                return req.reject(
                    404,
                    "Spacefarer not found."
                );
            }

            if (!userCanAccessPlanet(req, spacefarer.originPlanet_ID)) {
                return req.reject(
                    403,
                    "You can only claim mission rewards for Spacefarers from your own planet."
                );
            }

            const updatedSpacefarer = await claimMissionReward({
                db,
                spacefarerMissionId,
            });

            await evaluateAchievements({
                db,
                spacefarerId: updatedSpacefarer.ID,
            });

            return updatedSpacefarer;
        });

        await super.init();
    }
}

function validateProgressionValues(req, data) {
    if (
        data.stardustCollection !== undefined &&
        data.stardustCollection < 0
    ) {
        req.reject(400, "Stardust collection cannot be negative.");
    }

    if (
        data.wormholeNavigationXp !== undefined &&
        data.wormholeNavigationXp < 0
    ) {
        req.reject(400, "Wormhole Navigation XP cannot be negative.");
    }
}

function userCanAccessPlanet(req, planetId) {
    const allowedPlanets = req.user.attr.planet ?? [];

    return allowedPlanets.includes(planetId);
}