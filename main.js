/*
 Requiring 'stack-overflow-rss' returns a function used to consume question feeds. The following options are allowed:

 tag or tags - The question tags.
 sort - Default is 'newest'. Can also be 'unanswered', 'active', 'votes' or 'faq'.
 pollInterval - Default is 1000 * 60 * 2 (2 minutes).
 lazy - Defer polling until the first subscription to 'new'. Default is true. You can use consumer.update()to trigger a single update.
 */

localStorage.so_tags = "";

window.jQuery = $ = require("jquery");

var stackOverflowRss = require('stack-overflow-rss');
var gui = require("nw.gui");
var soConsumer = createStackoverflowConsumer();
var notifier = require('nw-notify');

notifier.setConfig({
    width: 350,
    height: 80,
    padding: 0,
    borderRadius: 5,
    displayTime: 15000,
    appIcon: notifier.getAppPath() + "/images/so-icon.png",
    defaultStyleContainer: {
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
        padding: 8,
        border: '1px solid #CCC',
        fontFamily: 'Arial',
        fontSize: 12,
        position: 'relative',
        lineHeight: '15px'
    },
    defaultWindow: {
        'always-on-top': true,
        'visible-on-all-workspaces': true,
        'show_in_taskbar': process.platform == "darwin",
        resizable: false,
        show: false,
        frame: false,
        transparent: true,
        toolbar: false
    }
});

function updateQuestions (questions) {
    //console.log("Updating " + questions.length + " questions");
    $('#questions_table').find('tbody').empty();
    $(function () {
        $.each(questions, function (i, item) {
            $('<tr>').append(
                $('<td class="col-md-8">').append($('<a>').attr('href', item.id).text(item.title).click(openInBrowser)),
                $('<td class="col-md-4">').append(item.tags.join(", "))
            ).appendTo('#questions_table tbody');
        });
    });
}

function newQuestions(questions) {
    //console.log("Got " + questions.length + " new questions");
    questions.forEach(function (item) {
        showNotification(item.tags.join(", "), item.title, function () {
            gui.Shell.openExternal(item.id);
        });
    });
}

function openInBrowser(event) {
    gui.Shell.openExternal(event.target.href);
    event.preventDefault();
}

var showNotification = function (title, body, callback) {

    notifier.notify({
        title: title,
        text: body,
        onShowFunc: function (event) {
        },
        onClickFunc: function (event) {
            if (callback) callback(event);
        },
        onCloseFunc: function (event) {
        }
    });
};

onload = function () {
    initTags();
    toggleShowHide();
};

function toggleTags() {
    $('#tags_input').toggle();
    $('#tags_text').toggle();
}

function saveTags(e){
    if(e.keyCode == 13){
        localStorage.so_tags = e.target.value;
        $('#tags_text').text(localStorage.so_tags);
        toggleShowHide();
        if(soConsumer) {
            soConsumer.stop();
            notifier.closeAll();
        }
        soConsumer = createStackoverflowConsumer();
    }
    return false;
}

function createStackoverflowConsumer() {
    var tagsString = localStorage.so_tags;
    if (tagsString) {
        var tagsJson = JSON.stringify(localStorage.so_tags.split(','));
        var newConsumer = stackOverflowRss({
            tags: tagsJson,
            lazy: true
        });
        newConsumer.on('update', updateQuestions);
        newConsumer.on('new', newQuestions);
        newConsumer.update();
        return newConsumer;
    }
}

function toggleShowHide() {
    var noTags = (!localStorage.so_tags || 0 === localStorage.so_tags.length);
    $('#tags_input')
        .toggle(noTags);
    $('#jumbotron')
        .toggle(noTags);
    $('#tags_text')
        .toggle(!noTags);
    $('#questions_table')
        .toggle(!noTags);
}

function initTags() {
    $('#tags_input')
        .val(localStorage.so_tags);
    $('#tags_text')
        .text(localStorage.so_tags);
}


