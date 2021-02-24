
(function (window, document, $, undefined) {
    'use strict';

    // A list of all building names in ID'ed order
    var buildingNames = util.save.building_names;
    var buildingIds = util.save.building_ids;
    var buildingsOwned = [];
    var buildingsAvailable = [];
    var buildingsHighlighted = [[], []];

    var lightningRNG = null;

    var miracleRNG = null;

    var breathRNG = null;
    var breathNames = ['Red', 'Green', 'Blue', 'White', 'Black'];
    var breathTier = 1;
    var maelstromRNG = null;
    var maelstromTargets = 3;
    var maelstromEffects = ['Mana Produced', 'Trophies Unlocked', 'Faction Coins found', 'Amount of Assistants'];

    var limitedWishRNG = null;
    var limitedWishEffects = ["Increase the production of all buildings", "Increase Assistants", "Increase Maximum Mana", "Increase Trophy Count and Offline Bonus", "Increase Faction Coin find chance", "Increase Mana Regeneration", "All Spell Durations count more"];
    var limitedWishEligibleEffects = [];
    var limitedWishActivityTime = 0;
    var limitedWishCastCount = 0;
    var baseLimitedWishCastCount = 0;

    var catalystRNG = null;
    var catalystEffects = ["Fairy Chanting", "Moon Blessing", "God's Hand", "Goblin's Greed", "Night Time", "Hellfire Blast", "Gem Grinder", "Holy Light", "Blood Frenzy"];
    var catalystEligibleEffects = [];
    var catalystTargets = 1;

    var DJC4RNG = null;
    var DJC4Hits = [[88, 88, 888], [88, 888, 88], [88, 88, 888], [88, 888, 88], [888, 88, 88], [888, 88, 88]];
    // Refresh the entire forecast
    var forecast = function (saveStr) {
        buildingsOwned = [];
        buildingsAvailable = [];
        buildingsHighlighted = buildingsHighlighted || [[], []];
        lightningRNG = null;
        miracleRNG = null;
        breathRNG = null;
        maelstromRNG = null;
        limitedWishRNG = null;
        catalystRNG = null;
        breathTier = 1;
        $('#lightningMessage, #lightningForecast, #miracleMessage, #miracleForecast, #breathMessage, #breathForecast, #maelstromMessage, #maelstromForecast, #limitedWishMessage, #limitedWishForecast, #catalystMessage, #catalystForecast, #catalystCurrent, #DJC4Message, #DJC4Forecast').html('');

        var save = SaveHandler.Decode(saveStr);
        window.decoded = save;
        console.log('Decoded save:', save);

        // Only buildings owned by the player can be hit
        for (var i of buildingIds) {
            if (save.buildings[i].q > 0) {
                buildingsOwned.push(i);
            }
            if (util.save.building_alignment[i] == 0 || util.save.building_alignment[i] == save.alignment) {
                buildingsAvailable.push(i);
            }
        }
        $('#buildings').html('<b>Buildings owned</b> <small><i>(Click a building to toggle its highlighting)</i></small><br>');
        for (var tier in buildingsOwned) {
            var bName = buildingNames[buildingsOwned[tier]];
            var span = $('<span />').html(bName).addClass('tier' + tier).data('tier', tier);
            if(buildingsHighlighted[0][tier] === true) span.addClass('highlight');
            if (tier != 0) $('#buildings').append(', ');
            $('#buildings').append(span);
        }

        forecastLightning(save, buildingsOwned);
        forecastMiracle(save, buildingsOwned);
        forecastBreath(save);
        forecastMaelstrom(save, buildingsAvailable);
        forecastLimitedWish(save);
        forecastCatalyst(save);
        forecastDJC4(save);
    };

    // Add the Lightning forecast
    var forecastLightning = function (save, buildingsOwned) {
        var lightningMessage = '';
        var lightningForecast = '';

        // Check if the save actually has Lightning Strikes to forecast
        if (!util.save.hasSpell(save, "Lightning Strike")) {
            lightningMessage = 'You don\'t have Lightning Strike.';
            lightningForecast = 'No Lightning.';
        } else if (save.alignment != 3 && !util.save.upgrade_owned(save, 688)) {
            lightningMessage = 'You are not Neutral aligned.';
            lightningForecast = 'No Lightning.';
        } else if (buildingsOwned.length == 0) {
            lightningMessage = 'You have no Buildings.';
            lightningForecast = 'No Lightning.';
        } else if (buildingsOwned.length == 1) {
            lightningMessage = 'You only have ' + buildingNames[buildingsOwned[0]] + '.';
            lightningForecast = 'The only Building you have, as often as you want.';
        }

        // Early exit
        if (lightningMessage != '' || lightningForecast != '') {
            $('#lightningMessage').html('<b>Lightning Strike</b><br>').append(lightningMessage);
            $('#lightningForecast').html('<b>Forecast</b><br>').append(lightningForecast);
            return;
        }

        // Create the RNG and get the initial forecast
        lightningRNG = new PM_PRNG(save.spells[13].s);
        lightningRNG.hasLightningRod = util.save.upgrade_owned(save, 143018);
        $('#lightningMessage').html('<b>Lightning Strike</b><br>Your RNG state is: ' + lightningRNG.state + '.');
        $('#lightningForecast').html('<b>Forecast</b> <small><i>(Click a building to toggle its highlighting)</i></small><br><ol></ol>')
            .append($('<button class="btn btn-link" type="button" />').html('Give me a longer Forecast').on('click', forecastLightningMore));

        forecastLightningMore();
    };

    // Add the Miracle forecast
    var forecastMiracle = function (save, buildingsOwned) {
        var miracleMessage = '';
        var miracleForecast = '';

        // (TEMP) Find the Miracle research upgrade
        var miracle = save.upgrades[143719];

        // Check if the save actually has Miracles to forecast
        if (!miracle || !miracle.u1) {
            miracleMessage = 'You can\'t get any Miracles yet.';
            miracleForecast = 'No Miracles.';
        } else if (buildingsOwned.length == 0) {
            miracleMessage = 'You have no Buildings.';
            miracleForecast = 'No Miracles.';
        } else if (buildingsOwned.length == 1) {
            miracleMessage = 'You only have ' + buildingNames[buildingsOwned[0]] + '.';
            miracleForecast = 'The only Building you have, as long as you want.';
        }

        // Early exit
        if (miracleMessage != '' || miracleForecast != '') {
            $('#miracleMessage').html('<b>Miracle</b><br>').append(miracleMessage);
            $('#miracleForecast').html('<b>Forecast</b><br>').append(miracleForecast);
            return;
        }

        // Create the RNG and get the initial forecast
        miracleRNG = new PM_PRNG(miracle.s);
        $('#miracleMessage').html('<b>Miracle</b><br>Your RNG state is: ' + miracleRNG.state + '.');
        $('#miracleForecast').html('<b>Forecast</b> <small><i>(Click a building to toggle its highlighting)</i></small><br><ol></ol>')
            .append($('<button class="btn btn-link" type="button" />').html('Give me a longer Forecast').on('click', forecastMiracleMore));

        forecastMiracleMore();
    };

    // Add the Breath forecast
    var forecastBreath = function (save) {
        var breathMessage = '';
        var breathForecast = '';

        // Check if the save actually has Dragons Breath to forecast
        if (!util.save.hasSpell(save, "Dragon's Breath")) {
            breathMessage = 'You don\'t have Dragon\'s Breath.';
            breathForecast = 'No Dragon\'s Breath.';
        }

        // Early exit
        if (breathMessage != '' || breathForecast != '') {
            $('#breathMessage').html('<b>Dragon\'s Breath</b><br>').append(breathMessage);
            $('#breathForecast').html('<b>Forecast</b><br>').append(breathForecast);
            return;
        }

        // Create the RNG and get the initial forecast
        breathRNG = new PM_PRNG(save.spells[21].s);
        // assume DB tier is active tiers
        breathTier = save.spells[21].activeTiers + 1;
        if (util.save.upgrade_owned(save, 796)) // Dragon Perk 4
        {
            breathTier *= 2;
        }

        $('#breathMessage').html('<b>Dragon\'s Breath</b><br>Your RNG state is: ' + breathRNG.state + '.');
        $('#breathForecast').html('<b>Forecast</b><br><ol></ol>')
            .append($('<button class="btn btn-link" type="button" />').html('Give me a longer Forecast').on('click', forecastBreathMore));

        forecastBreathMore();
    };

    // Add Lightning forecast hits
    var forecastLightningMore = function (e) {
        if (buildingsOwned.length > 0 && lightningRNG)
            for (var i = 0; i < 10; i++) {
                var len = buildingsOwned.length;
                if (lightningRNG.hasLightningRod && buildingsOwned[-1] == buildingIds[-1]) {
                    len -= 1;
                }
                var tier = lightningRNG.strikeTier(len);
                var hit = buildingNames[buildingsOwned[tier]];
                var li = $('<li />').html(hit).addClass('tier' + tier).data('tier', tier);
                $('#lightningForecast > ol').append(li);
            }

        // Update building highlighting
        for (var tier in buildingsHighlighted[0])
            if (buildingsHighlighted[0][tier])
                $('#lightningForecast > ol > li.tier' + tier).addClass('highlight');
            else
                $('#lightningForecast > ol > li.tier' + tier).removeClass('highlight');
    };

    // Add Miracle forecast hits
    var forecastMiracleMore = function (e) {
        if (buildingsOwned.length > 0 && miracleRNG)
            for (var i = 0; i < 10; i++) {
                var tier = miracleRNG.strikeTier(buildingsOwned.length);
                var hit = buildingNames[buildingsOwned[tier]];
                var li = $('<li />').html(hit).addClass('tier' + tier).data('tier', tier);
                $('#miracleForecast > ol').append(li);
            }

        // Update building highlighting
        for (var tier in buildingsHighlighted[1])
            if (buildingsHighlighted[1][tier])
                $('#miracleForecast > ol > li.tier' + tier).addClass('highlight');
            else
                $('#miracleForecast > ol > li.tier' + tier).removeClass('highlight');
    };

    // Add Breath forecast hits
    var forecastBreathMore = function (e) {
        if (breathRNG) {
            for (var i = 0; i < 10; i++) {
                var hits = [0, 0, 0, 0, 0];
                var textResult = [];
                //slice() clones the array
                var eligible = breathNames.slice();
                for (var c = 0; c < breathTier; c++) {
                    var len = eligible.length;
                    var breathColor = breathRNG.nextIntRange(0, len - 1);
                    var hit = eligible.splice(breathColor, 1);
                    var tier = breathNames.indexOf(hit[0]);

                    if (eligible.length == 0) {
                        eligible = breathNames.slice();
                    }

                    hits[tier]++;
                }

                for (var c = 0; c <= 5; c++) {
                    if (hits[c] > 0) {
                        textResult.push('<span class="breath' + breathNames[c] + '">' + breathNames[c] + ((hits[c] > 1) ? '(x' + hits[c] + ')' : '') + '</span>');
                    }
                }

                var li = $('<li />').html(textResult.join(', '));
                $('#breathForecast > ol').append(li);
            }
        }
    };

    // Add the Maelstrom forecast
    let maelstromForecastSelector = '#maelstromForecast'
    let maelstromLISelector = maelstromForecastSelector + ' > ol > li';

    var forecastMaelstrom = function (save, buildingsAvailable) {
        var maelstromMessage = '';
        var maelstromForecast = '';

        // Check if the save actually has Maelstrom to forecast
        if (!util.save.hasSpell(save, "Maelstrom")) {
            maelstromMessage = 'You don\'t have Maelstrom.';
            maelstromForecast = 'No Chaos that is trying to pull you in.';
        }

        // Early exit
        if (maelstromMessage != '' || maelstromForecast != '') {
            $('#maelstromMessage').html('<b>Maelstrom</b><br>').append(maelstromMessage);
            $(maelstromForecastSelector).html('<b>Forecast</b><br>').append(maelstromForecast);
            return;
        }

        // Create the RNG and get the initial forecast
        maelstromRNG = new PM_PRNG(save.spells[27].s);

        $('#maelstromMessage').html('<b>Maelstrom</b><br>Your RNG state is: ' + maelstromRNG.state + '.');
        $(maelstromForecastSelector).html('<b>Forecast</b><br><ol></ol>')
            .append($('<button class="btn btn-link" type="button" />').html('Give me a longer Forecast').on('click', forecastMaelstromMore));

        forecastMaelstromMore();
    };

    // Add Breath forecast hits
    var forecastMaelstromMore = function (e) {
        if (maelstromRNG) {
            for (var i = 0; i < 10; i++) {
                //slice() clones the array
                var eligible = buildingsAvailable.slice();
                var tierMap = {};
                buildingsAvailable.map((bi,i) => tierMap[bi] = i);
                var targets = [];
                var effects = [];
                var textResult = [];

                // Targets
                for (var c = 0; c < maelstromTargets; c++) {
                    var len = eligible.length;
                    var loc = maelstromRNG.nextIntRange(0, len - 1);
                    var hit = eligible[loc];
                    eligible.splice(loc, 1);
                    targets.push(hit);
                }

                // Effects
                for (var c = 0; c < maelstromTargets; c++) {
                    var len = maelstromEffects.length;
                    var hit = maelstromRNG.nextIntRange(0, len - 1);
                    effects.push(maelstromEffects[hit]);
                }

                // Text Result
                for (var c = 0; c < maelstromTargets; c++) {
                    var tier = tierMap[targets[c]];
                    var isHighlight = buildingsHighlighted[0][tier] === true;
                    var spanClasses = 'tier' + tier + (isHighlight ? ' highlight': '');
                    var bName = buildingNames[targets[c]];
                    textResult.push((c + 1) + '. <span data-tier="' + tier + '" class="' + spanClasses + '">' + bName + '</span>, ' + effects[c]);
                }

                var li = $('<li />').html(textResult.join('<br/>'));//.addClass('tier' + targets[c]).data('tier', targets[c]);
                $(maelstromForecastSelector + ' > ol').append(li);
            }
        }
    };

    // Add the Limited Wish forecast
    var forecastLimitedWish = function (save, buildingsAvailable) {
        var limitedWishMessage = '';
        var limitedWishForecast = '';

        // Check if the save actually has Limited Wish to forecast
        if (!util.save.hasSpell(save, "Limited Wish")) {
            limitedWishMessage = 'You don\'t have Limited Wish.';
            limitedWishForecast = 'The Genie is in an another lamp.';
        }

        // Early exit
        if (limitedWishMessage != '' || limitedWishForecast != '') {
            $('#limitedWishMessage').html('<b>Limited Wish</b><br>').append(limitedWishMessage);
            $('#limitedWishForecast').html('<b>Forecast</b><br>').append(limitedWishForecast);
            $('#limitedWishForecastOptions').hide();
            return;
        }


        // Create the RNG and get the initial forecast
        limitedWishRNG = new PM_PRNG(save.spells[29].s);

        limitedWishActivityTime = save.spells[29].active0;
        limitedWishCastCount = save.spells[29].c;
        baseLimitedWishCastCount = 1;

        // Persistent Entropy
        if (util.save.upgrade_owned(save, 975)) {
            limitedWishCastCount += 149;
            baseLimitedWishCastCount = 149;
        }

        // Djinn perk 1
        if (util.save.upgrade_owned(save, 962)) {
            limitedWishCastCount += save.spells[31].c;
        }

        limitedWishCastCount = Math.floor(limitedWishCastCount);

        limitedWishEligibleEffects = [];

        // Full Wish
        if (!util.save.upgrade_owned(save, 994)) {
            limitedWishEligibleEffects.push(limitedWishEffects[0]);
        }

        if (save.alignment == 1) {
            limitedWishEligibleEffects.push(limitedWishEffects[1]);
            limitedWishEligibleEffects.push(limitedWishEffects[6]);
            limitedWishEligibleEffects.push(limitedWishEffects[5]);
        }
        else if (save.alignment == 2) {
            limitedWishEligibleEffects.push(limitedWishEffects[3]);
            limitedWishEligibleEffects.push(limitedWishEffects[5]);
            limitedWishEligibleEffects.push(limitedWishEffects[4]);
        }
        else if (save.alignment == 3) {
            limitedWishEligibleEffects.push(limitedWishEffects[2]);
            limitedWishEligibleEffects.push(limitedWishEffects[6]);
            limitedWishEligibleEffects.push(limitedWishEffects[4]);
        }

        $('#limitedWishMessage').html('<b>Limited Wish</b><br>Your RNG state is: ' + limitedWishRNG.state + '.');
        $('#limitedWishForecast, #limitedWishForecastAlt').html('<b>Forecast</b><br><ol></ol>')
            .append($('<button class="btn btn-link" type="button" />').html('Give me a longer Forecast').on('click', forecastLimitedWishMore));

        forecastLimitedWishMore();
        limitedWishShowForecast();
        $('#limitedWishForecastOptions').show();
    };

    var forecastLimitedWishMore = function (e) {
        if (limitedWishRNG) {
            for (var i = 0; i < 10; i++) {
                var typeHit = limitedWishRNG.nextIntRange(0, limitedWishEligibleEffects.length - 1);
                var strengthHit = Math.floor(limitedWishRNG.nextDoubleRange(baseLimitedWishCastCount, limitedWishCastCount + 1));

                //Due to Djinn perk 3 we can no longer accurately calculate limitedWish
                //create two results for both value and percentage
                var textResult = limitedWishEligibleEffects[typeHit] + ' with random value of ' + strengthHit.toLocaleString() + " (out of maximum of " + limitedWishCastCount.toLocaleString() + ").";
                var textResult2 = limitedWishEligibleEffects[typeHit] + ' with ' + ((strengthHit ** 0.45 / limitedWishCastCount ** 0.45) * 100).toPrecision(4) + '% strength';
                var li = $('<li />').html(textResult);
                var li2 = $('<li />').html(textResult2);
                $('#limitedWishForecast > ol').append(li);
                $('#limitedWishForecastAlt > ol').append(li2);

                limitedWishActivityTime += 12; // spell duration
                limitedWishCastCount++;
            }
        }
    };

    var limitedWishFormula = function (spellActivity, castCount) {
        return 2.25 * Math.pow(Math.log(spellActivity + 1), 1.35) * Math.pow(castCount, 0.45);
    }

    var limitedWishShowForecast = function () {
        if ($('input[name=LWForecastType]:checked').val() == "percentage") {
            $('#limitedWishForecast').hide();
            $('#limitedWishForecastAlt').show();
        }
        //default case: value
        else {
            $('#limitedWishForecast').show();
            $('#limitedWishForecastAlt').hide();
        }
    }

    // Add the Catalyst forecast
    var forecastCatalyst = function (save) {
        var catalystMessage = '';
        var catalystForecast = '';

        // Check if the save actually has Catalyst to forecast
        if (!util.save.hasSpell(save, "Catalyst")) {
            catalystMessage = 'You don\'t have Catalyst.';
            catalystForecast = 'Who knew chaotic blood was so magical?';
        }

        // Early exit
        if (catalystMessage != '' || catalystForecast != '') {
            $('#catalystMessage').html('<b>Catalyst</b><br>').append(catalystMessage);
            $('#catalystForecast').html('<b>Forecast</b><br>').append(catalystForecast);
            return;
        }

        // Create the RNG and get the initial forecast
        catalystRNG = new PM_PRNG(save.spells[31].s);

        //check if djinn challenge 3 is active
        catalystTargets = util.save.challenge_active(save, 991) ? 2 : 1;
        //filter out already owned spells
        catalystEligibleEffects = catalystEffects.filter(spell => !util.save.hasSpell(save, spell));
        //ugh2
        var spellIDs = [null, null, 'Holy Light', 'Blood Frenzy', 'Gem Grinder', null, null, null, 'Fairy Chanting', 'Moon Blessing', 'God\'s Hand', 'Goblin\'s Greed', 'Night Time', 'Hellfire Blast'];
        $('#catalystMessage').html('<b>Catalyst</b><br>Your RNG state is: ' + catalystRNG.state + '.');
        if (save.catalystTargets.length > 0) $('#catalystCurrent').html('Your current spell is: ' + spellIDs[save.catalystTargets[0]['targetspell']]);
        if (save.catalystTargets.length > 1) $('#catalystCurrent').append('<br>' + 'Your second current spell is: ' + spellIDs[save.catalystTargets[1]['targetspell']]);
        $('#catalystForecast').html('<b>Forecast</b><br><ol></ol>')
            .append($('<button class="btn btn-link" type="button" />').html('Give me a longer Forecast').on('click', forecastCatalystMore));

        forecastCatalystMore();
    };

    var forecastCatalystMore = function (e) {
        if (catalystRNG) {
            for (var i = 0; i < 10; i++) {
                var textResult = '';
                var tempEligibleEffects = catalystEligibleEffects.slice();
                for (var j = 0; j < catalystTargets; ++j) {
                    var typeHit = catalystRNG.nextIntRange(0, tempEligibleEffects.length - 1);
                    textResult += (j > 0 ? ', ' : '') + tempEligibleEffects[typeHit];
                    tempEligibleEffects.splice(typeHit, 1);
                }
                var li = $('<li />').html(textResult);;
                $('#catalystForecast > ol').append(li);
            }
        }
    };

    var forecastDJC4 = function (save) {
        if (!(util.save.challenge_active(save, 992))) {
            $('#DJC4Message').html('<b>Worldly Desires</b><br>There is no desire here...');
            $('#DJC4Forecast').html('<b>Forecast</b><br>No Worldly Desires.');
            return;
        }
        DJC4RNG = new PM_PRNG(save.upgrades[992].s);
        $('#DJC4Message').html('<b>Worldly Desires</b><br>Your RNG state is: ' + DJC4RNG.state + '.');
        $('#DJC4Forecast').html('<b>Forecast</b><br><ol></ol>')
            .append($('<button class="btn btn-link" type="button" />').html('Give me a longer Forecast').on('click', forecastDJC4More));
        forecastDJC4More(save);
    };
    //assistants, gem production, max mana
    var forecastDJC4More = function () {
        if (DJC4RNG) {
            for (var i = 0; i < 10; ++i) {
                var hit = DJC4Hits[DJC4RNG.nextIntRange(0, DJC4Hits.length - 1)];
                var textResult = 'Increasing Assistants by ' + hit[0] + '%, Production Bonus from Gems by ' + hit[1] + '% and Maximum Mana by ' + hit[2] + '%.';
                var li = $('<li />').html(textResult);;
                $('#DJC4Forecast > ol').append(li);
            }
        }
    }

    $(function () {

        // Initialize Bootstrap popovers
        $('[data-toggle="popover"]').popover();

        // Bind Save decoding and parsing
        $('#saveInput').on('paste', function (e) {
            // Empty the input right before the paste comes through
            $(this).val('');

            // The timeout ensures we can grab the save right after the paste comes through, without messing with the clipboard
            var self = this;
            setTimeout(function () {
                var saveStr = $(self).val();
                if (saveStr)
                    forecast(saveStr);
            }, 1);
        }).trigger('focus');

        // Bind Re-Enter button to refresh the forecast using the current save string
        $('#doReEnter').on('click', function (e) {
            $('#saveInput').trigger('focus');
            var saveStr = $('#saveInput').val();
            if (saveStr)
                forecast(saveStr);
        });

        // Bind Copy button to copy the current save string
        $('#doSaveCopy').on('click', function (e) {
            $('#saveInput').trigger('focus');
            var save = $('#saveInput').val();
            window.prompt('Copy to clipboard: Press Ctrl+C, then Enter', save);
        });

        // Bind Clear button to clear the save input field
        $('#doSaveClear').on('click', function (e) {
            $('#saveInput').val('').trigger('focus');
        });

        // Automatically lengthen the forecast when scrolling to the bottom of the screen
        $(document).on('mousewheel DOMMouseScroll', function (e) {
            var delta = Math.max(-1, Math.min(1, (e.originalEvent.wheelDelta || -e.originalEvent.detail)));
            if (delta == -1 && ($(window).scrollTop() + $(window).height() >= $(document).height())) {
                forecastLightningMore();
                forecastMiracleMore();
                forecastBreathMore();
                forecastMaelstromMore();
            }
        });

        // Click to toggle a building highlight
        $('#lightningForecast, #miracleForecast').on('click', 'ol > li', function (e) {
            var type = $(this).parent().parent().parent().index();
            var tier = $(this).data('tier');
            if (buildingsHighlighted[type][tier]) {
                buildingsHighlighted[type][tier] = false;
                $(this).parent().children('.tier' + tier).removeClass('highlight');
            } else {
                buildingsHighlighted[type][tier] = true;
                $(this).parent().children('.tier' + tier).addClass('highlight');
            }
            // Hover to temporarily highlight the building
        }).on('mouseenter', 'ol > li', function (e) {
            $(this).parent().children('.tier' + $(this).data('tier')).addClass('hover');
        }).on('mouseleave', 'ol > li', function (e) {
            $(this).parent().children('.tier' + $(this).data('tier')).removeClass('hover');
        });

        $('#buildings').on('click', 'span', function (e) {
            var tier = $(this).data('tier');
            if ($(this).hasClass('highlight')) {
                $(this).removeClass('highlight');
                buildingsHighlighted[0][tier] = buildingsHighlighted[1][tier] = false;
                $('#lightningForecast > ol, #miracleForecast > ol, ' + maelstromLISelector).children('.tier' + tier).removeClass('highlight');
            } else {
                $(this).addClass('highlight');
                buildingsHighlighted[0][tier] = buildingsHighlighted[1][tier] = true;
                $('#lightningForecast > ol, #miracleForecast > ol, ' + maelstromLISelector).children('.tier' + tier).addClass('highlight');
            }
        }).on('mouseenter', 'span', function (e) {
            $(this).addClass('hover');
            $('#lightningForecast > ol, #miracleForecast > ol').children('.tier' + $(this).data('tier')).addClass('hover');
        }).on('mouseleave', 'span', function (e) {
            $(this).removeClass('hover');
            $('#lightningForecast > ol, #miracleForecast > ol').children('.tier' + $(this).data('tier')).removeClass('hover');
        });

        $('input[type=radio][name=LWForecastType]').change(function () {
            limitedWishShowForecast();
        });

    });

}(window, document, jQuery));
