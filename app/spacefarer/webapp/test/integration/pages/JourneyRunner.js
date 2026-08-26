sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"galactic/spacefarer/app/spacefarer/test/integration/pages/SpacefarersList.gen",
	"galactic/spacefarer/app/spacefarer/test/integration/pages/SpacefarersObjectPage.gen"
], function (JourneyRunner, SpacefarersListGenerated, SpacefarersObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('galactic/spacefarer/app/spacefarer') + '/test/flp.html#app-preview',
        pages: {
			onTheSpacefarersListGenerated: SpacefarersListGenerated,
			onTheSpacefarersObjectPageGenerated: SpacefarersObjectPageGenerated
        },
        async: true
    });

    return runner;
});

