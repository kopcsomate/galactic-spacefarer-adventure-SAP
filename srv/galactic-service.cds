using { galactic.spacefarer as db } from '../db/schema';

service GalacticSpacefarerService {

    entity Spacefarers as projection on db.Spacefarers;

    @readonly
    entity Planets as projection on db.Planets;

    @readonly
    entity Departments as projection on db.Departments;

    @readonly
    entity Positions as projection on db.Positions;

    @readonly
    entity Achievements as projection on db.Achievements;

    @readonly
    entity Missions as projection on db.Missions;

    @readonly
    entity SpacefarerAchievements as projection on db.SpacefarerAchievements;

    @readonly
    entity SpacefarerMissions as projection on db.SpacefarerMissions;
    
    action startMission(
        spacefarerId : UUID,
        missionId    : UUID
    ) returns SpacefarerMissions;

    action claimMissionReward(
        spacefarerMissionId : UUID
    ) returns Spacefarers;
}