namespace galactic.spacefarer;

using {
    cuid,
    managed
} from '@sap/cds/common';

// A bolygók törzsadatai.
// Ezekre a Spacefarer entitás később associationnel fog hivatkozni.
entity Planets : cuid, managed {
    name   : String(100) not null;
    galaxy : String(100);
}

// A szervezeti egységek törzsadatai.
entity Departments : cuid, managed {
    name        : String(100) not null;
    description : String(500);
}

// A Spacefarerek által betölthető pozíciók.
entity Positions : cuid, managed {
    title : String(100) not null;
    level : Integer;
}

// A rendszer központi üzleti entitása.
// Egy Spacefarer egy bolygóhoz, részleghez és pozícióhoz kapcsolódik.
entity Spacefarers : cuid, managed {
    firstName : String(100) not null;
    lastName  : String(100) not null;
    email     : String(255) not null;

    stardustCollection : Integer default 0;
    stardustStatus     : String(30);

    wormholeNavigationXp    : Integer default 0;
    wormholeNavigationSkill : Integer default 10;

    spacesuitColor : String(30) not null;

    originPlanet : Association to one Planets not null;
    department   : Association to one Departments not null;
    position     : Association to one Positions not null;
    achievements : Composition of many SpacefarerAchievements on achievements.spacefarer = $self;
    missions : Composition of many SpacefarerMissions on missions.spacefarer = $self;
}

// Az elérhető achievementek törzsadatai.
// Ezek önállóan léteznek, függetlenül attól, hogy egy Spacefarer megszerezte-e őket.
entity Achievements : cuid, managed {
    code        : String(50) not null;
    title       : String(100) not null;
    description : String(500);

    // A sorrend később az Object Page-en való megjelenítéshez is használható.
    displayOrder : Integer not null;
}

// Azt tárolja, hogy egy Spacefarer mely achievementeket szerezte meg.
// Ez a rekord önmagában nem értelmezhető a hozzá tartozó Spacefarer nélkül.
@assert.unique.spacefarerAchievement: [spacefarer, achievement]
entity SpacefarerAchievements : cuid, managed {
    spacefarer  : Association to one Spacefarers not null;
    achievement : Association to one Achievements not null;

    unlockedAt : Timestamp not null;
}

// A rendszerben elérhető küldetések törzsadatai.
entity Missions : cuid, managed {
    code               : String(50) not null;
    title              : String(100) not null;
    description        : String(500);

    durationSeconds    : Integer not null;
    navigationXpReward : Integer not null;

    displayOrder       : Integer not null;
}

// Egy Spacefarer által elindított konkrét küldetést tárol.
// A rekord lifecycle-ja a Spacefarerhez tartozik.
entity SpacefarerMissions : cuid, managed {
    spacefarer : Association to one Spacefarers not null;
    mission    : Association to one Missions not null;

    startedAt       : Timestamp not null;
    completesAt     : Timestamp not null;
    rewardClaimedAt : Timestamp;
}