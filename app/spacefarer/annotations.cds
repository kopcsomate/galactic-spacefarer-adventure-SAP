using GalacticSpacefarerService as service from '../../srv/galactic-service';

annotate service.Spacefarers with @(
    UI.HeaderInfo: {
        TypeName: 'Spacefarer',
        TypeNamePlural: 'Spacefarers',
        Title: {
            $Type: 'UI.DataField',
            Value: firstName
        },
        Description: {
            $Type: 'UI.DataField',
            Value: lastName
        }
    },

    UI.SelectionFields: [
        firstName,
        lastName,
        originPlanet_ID,
        department_ID,
        position_ID,
        stardustStatus
    ],

    UI.LineItem: [
        {
            $Type: 'UI.DataField',
            Value: firstName,
            Label: 'First Name'
        },
        {
            $Type: 'UI.DataField',
            Value: lastName,
            Label: 'Last Name'
        },
        {
            $Type: 'UI.DataField',
            Value: originPlanet.name,
            Label: 'Origin Planet'
        },
        {
            $Type: 'UI.DataField',
            Value: department.name,
            Label: 'Department'
        },
        {
            $Type: 'UI.DataField',
            Value: position.title,
            Label: 'Position'
        },
        {
            $Type: 'UI.DataField',
            Value: stardustStatus,
            Label: 'Stardust Status'
        },
        {
            $Type: 'UI.DataField',
            Value: wormholeNavigationSkill,
            Label: 'Navigation Skill'
        },
        {
            $Type: 'UI.DataField',
            Value: spacesuitColor,
            Label: 'Spacesuit'
        }
    ],

    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'General Information',
            Target: '@UI.FieldGroup#General'
        },
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Spacefaring Progress',
            Target: '@UI.FieldGroup#Progress'
        },
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Achievements',
            Target: 'achievements/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Missions',
            Target: 'missions/@UI.LineItem'
        }
    ],

    UI.FieldGroup#General: {
        Data: [
            {
                $Type: 'UI.DataField',
                Value: firstName,
                Label: 'First Name'
            },
            {
                $Type: 'UI.DataField',
                Value: lastName,
                Label: 'Last Name'
            },
            {
                $Type: 'UI.DataField',
                Value: email,
                Label: 'Email'
            },
            {
                $Type: 'UI.DataField',
                Value: originPlanet.name,
                Label: 'Origin Planet',
                ![@UI.Hidden]: {
                    $edmJson: {
                        $Not: [
                            { $Path: 'IsActiveEntity' }
                        ]
                    }
                }
            },
            {
                $Type: 'UI.DataField',
                Value: originPlanet_ID,
                Label: 'Origin Planet',
                ![@UI.Hidden]: IsActiveEntity
            },
            {
                $Type: 'UI.DataField',
                Value: department.name,
                Label: 'Department',
                ![@UI.Hidden]: {
                    $edmJson: {
                        $Not: [
                            { $Path: 'IsActiveEntity' }
                        ]
                    }
                }
            },
            {
                $Type: 'UI.DataField',
                Value: department_ID,
                Label: 'Department',
                ![@UI.Hidden]: IsActiveEntity
            },
            {
                $Type: 'UI.DataField',
                Value: position.title,
                Label: 'Position',
                ![@UI.Hidden]: {
                    $edmJson: {
                        $Not: [
                            { $Path: 'IsActiveEntity' }
                        ]
                    }
                }
            },
            {
                $Type: 'UI.DataField',
                Value: position_ID,
                Label: 'Position',
                ![@UI.Hidden]: IsActiveEntity
            },
            {
                $Type: 'UI.DataField',
                Value: spacesuitColor,
                Label: 'Spacesuit Color'
            }
        ]
    },

    UI.FieldGroup#Progress: {
        Data: [
            {
                $Type: 'UI.DataField',
                Value: stardustCollection,
                Label: 'Stardust Collection'
            },
            {
                $Type: 'UI.DataField',
                Value: stardustStatus,
                Label: 'Stardust Status'
            },
            {
                $Type: 'UI.DataField',
                Value: wormholeNavigationXp,
                Label: 'Navigation XP'
            },
            {
                $Type: 'UI.DataField',
                Value: wormholeNavigationSkill,
                Label: 'Navigation Skill'
            },
            {
                $Type: 'UI.DataField',
                Value: achievementProgress,
                Label: 'Achievements'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Label: 'Start Mission',
                Action: 'GalacticSpacefarerService.startMissionForSpacefarer'
            }
        ]
    }
);

annotate service.SpacefarerAchievements with @(
    UI.LineItem: [
        {
            $Type: 'UI.DataField',
            Value: achievement.title,
            Label: 'Achievement'
        },
        {
            $Type: 'UI.DataField',
            Value: achievement.description,
            Label: 'Description'
        },
        {
            $Type: 'UI.DataField',
            Value: unlockedAt,
            Label: 'Unlocked At'
        }
    ]
);

annotate service.SpacefarerMissions with @(
    UI.LineItem: [
        {
            $Type: 'UI.DataField',
            Value: mission.title,
            Label: 'Mission'
        },
        {
            $Type: 'UI.DataField',
            Value: mission.description,
            Label: 'Description'
        },
        {
            $Type: 'UI.DataField',
            Value: missionStatus,
            Label: 'Status'
        },
        {
            $Type: 'UI.DataField',
            Value: completesAt,
            Label: 'Completes At'
        },
        {
            $Type: 'UI.DataFieldForAction',
            Label: 'Claim Reward',
            Action: 'GalacticSpacefarerService.claimReward',
            Inline: true
        }
    ]
);


annotate service.Spacefarers with {
    firstName          @title: 'First Name';
    lastName           @title: 'Last Name';
    email              @title: 'Email';
    originPlanet_ID @(
        title: 'Origin Planet',
        Common.Text: originPlanet.name
    );

    department_ID @(
        title: 'Department',
        Common.Text: department.name
    );

    position_ID @(
        title: 'Position',
        Common.Text: position.title
    );
    stardustCollection @title: 'Stardust';
    stardustStatus     @title: 'Stardust Status';
    spacesuitColor     @title: 'Spacesuit Color';
    wormholeNavigationXp @title: 'Navigation XP';
    wormholeNavigationSkill @title: 'Navigation Skill';
};


annotate service.Planets with {
    ID @(
        title: 'Planet',
        Common.Text: name,
        UI.TextArrangement: #TextOnly,
        UI.Hidden
    );

    name       @title: 'Planet';
    galaxy     @title: 'Galaxy';

    createdAt  @UI.Hidden;
    createdBy  @UI.Hidden;
    modifiedAt @UI.Hidden;
    modifiedBy @UI.Hidden;
};

annotate service.Departments with {
    ID @(
        title: 'Department',
        Common.Text: name,
        UI.TextArrangement: #TextOnly,
        UI.Hidden
    );

    name        @title: 'Department';
    description @title: 'Description';

    createdAt  @UI.Hidden;
    createdBy  @UI.Hidden;
    modifiedAt @UI.Hidden;
    modifiedBy @UI.Hidden;
};

annotate service.Positions with {
    ID @(
        title: 'Position',
        Common.Text: title,
        UI.TextArrangement: #TextOnly,
        UI.Hidden
    );

    title @title: 'Position';
    level @title: 'Level';

    createdAt  @UI.Hidden;
    createdBy  @UI.Hidden;
    modifiedAt @UI.Hidden;
    modifiedBy @UI.Hidden;
};


