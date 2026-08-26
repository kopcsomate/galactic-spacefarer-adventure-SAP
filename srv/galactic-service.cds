using { galactic.spacefarer as db } from '../db/schema';

@requires: 'authenticated-user'
service GalacticSpacefarerService {
    @odata.draft.enabled
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
        },
        {
            grant: 'startMissionForSpacefarer',
            to: 'SpacefarerManager',
            where: (originPlanet.ID = $user.planet)
        }
    ])
    entity Spacefarers as projection on db.Spacefarers {
        *,
        stardustStatus          @readonly,
        wormholeNavigationXp    @readonly,
        wormholeNavigationSkill @readonly,

        virtual achievementCount : Integer @readonly,
        virtual achievementTotal : Integer @readonly,
        virtual achievementProgress : String(20) @readonly
    }
    actions {
        @requires: 'SpacefarerManager'
        @cds.odata.bindingparameter.name: 'in'
        @Common.SideEffects: {
            TargetEntities: [
                'in/missions'
            ]
        }
        action startMissionForSpacefarer(
            @title: 'Mission'
            @Common.ValueList: {
                $Type: 'Common.ValueListType',
                Label: 'Mission',
                CollectionPath: 'Missions',
                Parameters: [
                    {
                        $Type: 'Common.ValueListParameterInOut',
                        LocalDataProperty: missionId,
                        ValueListProperty: 'ID'
                    },
                    {
                        $Type: 'Common.ValueListParameterDisplayOnly',
                        ValueListProperty: 'title'
                    },
                    {
                        $Type: 'Common.ValueListParameterDisplayOnly',
                        ValueListProperty: 'description'
                    },
                    {
                        $Type: 'Common.ValueListParameterDisplayOnly',
                        ValueListProperty: 'durationSeconds'
                    },
                    {
                        $Type: 'Common.ValueListParameterDisplayOnly',
                        ValueListProperty: 'navigationXpReward'
                    }
                ]
            }
            missionId : UUID
        ) returns SpacefarerMissions;
    };

    @readonly
    @cds.odata.valuelist
    @title: 'Planets'
    entity Planets as projection on db.Planets;

    @readonly
    @cds.odata.valuelist
    @title: 'Departments'
    entity Departments as projection on db.Departments;

    @readonly
    @cds.odata.valuelist
    @title: 'Positions'
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

    @readonly
    @(restrict: [
        {
            grant: 'READ',
            to: ['SpacefarerViewer', 'SpacefarerManager'],
            where: (spacefarer.originPlanet.ID = $user.planet)
        },
        {
            grant: 'claimReward',
            to: 'SpacefarerManager',
            where: (spacefarer.originPlanet.ID = $user.planet)
        }
    ])
    entity SpacefarerMissions as projection on db.SpacefarerMissions {
        *,
        virtual missionStatus : String(30) @readonly
    }
    actions {
        @requires: 'SpacefarerManager'
        @cds.odata.bindingparameter.name: 'in'
        @Common.SideEffects: {
            TargetProperties: [
                'in/rewardClaimedAt',
                'in/missionStatus',
                'in/spacefarer/wormholeNavigationXp',
                'in/spacefarer/wormholeNavigationSkill'
            ],
            TargetEntities: [
                'in/spacefarer/achievements'
            ]
        }
        action claimReward() returns Spacefarers;
    };
    
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