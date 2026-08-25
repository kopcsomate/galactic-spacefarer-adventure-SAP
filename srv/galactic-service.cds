using { galactic.spacefarer as db } from '../db/schema';

@requires: 'authenticated-user'
service GalacticSpacefarerService {

    @(restrict: [
        {
            grant: 'READ',
            to: ['SpacefarerViewer', 'SpacefarerManager'],
            where: (originPlanet.ID = $user.planet)
        },
        {
            grant: ['CREATE', 'UPDATE', 'DELETE'],
            to: 'SpacefarerManager',
            where: (originPlanet.ID = $user.planet)
        }
    ])
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

    @(restrict: [
        {
            grant: 'READ',
            to: ['SpacefarerViewer', 'SpacefarerManager'],
            where: (spacefarer.originPlanet.ID = $user.planet)
        }
    ])
    @readonly
    entity SpacefarerAchievements as projection on db.SpacefarerAchievements;

    @(restrict: [
        {
            grant: 'READ',
            to: ['SpacefarerViewer', 'SpacefarerManager'],
            where: (spacefarer.originPlanet.ID = $user.planet)
        }
    ])
    @readonly
    entity SpacefarerMissions as projection on db.SpacefarerMissions;
    
    @requires: 'SpacefarerManager'
    action startMission(
        spacefarerId : UUID,
        missionId    : UUID
    ) returns SpacefarerMissions;

    @requires: 'SpacefarerManager'
    action claimMissionReward(
        spacefarerMissionId : UUID
    ) returns Spacefarers;
}