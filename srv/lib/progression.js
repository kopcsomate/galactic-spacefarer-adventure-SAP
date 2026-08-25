export function calculateStardustStatus(stardustCollection) {
    if (stardustCollection >= 1000) {
        return "Galactic Elite";
    }

    if (stardustCollection >= 500) {
        return "Voyager";
    }

    if (stardustCollection >= 100) {
        return "Explorer";
    }

    return "Rookie";
}

export function calculateNavigationSkill(navigationXp) {
    if (navigationXp >= 1000) {
        return 100;
    }

    if (navigationXp >= 500) {
        return 75;
    }

    if (navigationXp >= 250) {
        return 50;
    }

    if (navigationXp >= 100) {
        return 25;
    }

    return 10;
}