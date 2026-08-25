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

export default class GalacticSpacefarerService extends cds.ApplicationService {
    async init() {
        const { Spacefarers } = this.entities;

        const db = await cds.connect.to("db");

        this.before("CREATE", Spacefarers, (req) => {
            const data = req.data;

            validateProgressionValues(req, data);

            // CREATE esetén mindig meghatározzuk a derived mezők kezdeti értékét.
            data.stardustStatus = calculateStardustStatus(
                data.stardustCollection ?? 0
            );

            data.wormholeNavigationSkill = calculateNavigationSkill(
                data.wormholeNavigationXp ?? 0
            );
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