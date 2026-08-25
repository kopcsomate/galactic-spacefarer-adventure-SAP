import cds from "@sap/cds";

import {
    calculateNavigationSkill,
    calculateStardustStatus,
} from "./lib/progression.js";

export default class GalacticSpacefarerService extends cds.ApplicationService {
    async init() {
        const { Spacefarers } = this.entities;

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