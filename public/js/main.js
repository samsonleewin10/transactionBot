(function (window) {

    var isRecording = false;
    var btnRecord;

    // AUDIO FUNCTIONS
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    var audioContext = new window.AudioContext();

    var audioInput = null,
        realAudioInput = null,
        inputPoint = null,
        audioRecorder = null;
    var analyserContext = null;

    function submit(blob){
        console.log(blob);

        var fd = new FormData();
        fd.append('fname', 'test.wav');
        fd.append('data', blob);

        $.ajax({
            type: 'POST',
            url: '/recognize',
            data: fd,
            processData: false,
            contentType: false,
            success: function(result){
                console.log('output updating to: ' + result);
                $('#spinPhrase').css('visibility', 'hidden');
                showPhrase(result);
            }
        });
    }

    function gotBuffers(buffers) {
        audioRecorder.exportWAV(doneEncoding);
    }

    function doneEncoding(blob) {
        submit(blob);
    }

    function intentReceived(jsonresponse)
    {
        var resp = JSON.parse(jsonresponse);

        var buildString = "我可以...";

        var entities = resp["entities"];

        // PROCESS THE JSON FOR INTENT AND ENTITIES
        if ( resp["intents"][0]["intent"] == "findFood") {
            // WE WANT TO ADD A CELL, SO LOOK FOR POSITION AND COLOR

            buildString += "幫你搵餐廳! 即刻介紹一間比你!";
            
            // var addColor = "";
            // var addPosition = "";

            // for ( var i = 0; i < entities.length; i++ ) {
            //     if ( entities[i]["type"] == "CellColor") {
            //         addColor = entities[i]["entity"];
            //         buildString += " [ Color: " + entities[i]["entity"] + "] ";
            //     }
            //     if ( entities[i]["type"] == "builtin.number") {
            //         addPosition = entities[i]["entity"];
            //         buildString += " [ Position: " + entities[i]["entity"] + "] ";
            //     }
            // }

            // if ( addColor != "" && addPosition != "") {
            //     addCell(addPosition, addColor);
            // }

            document.getElementById("botWindow").src="../images/restaurant001.png";
            var audio = new Audio('../audios/sampleCanto_Male.wav');
            audio.play();
        }
        
        if (resp["intents"][0]["intent"] == "findFun" )
        {
            buildString += "介紹呢個商場嘅好去處，包你玩得開心!";

            // var movePos = "";
            // var moveDirection = "";

            // for ( var i = 0; i < entities.length; i++ ) {
            //     if ( entities[i]["type"] == "builtin.number" || (entities[i]["type"] == "position") ) {
            //         buildString += " [ Position: " + entities[i]["entity"] + "] ";
            //         movePos = entities[i]["entity"];
            //     }
            //     if ( entities[i]["type"] == "direction") {
            //         buildString += " [ Direction: " + entities[i]["entity"] + "] ";
            //         moveDirection = entities[i]["entity"];
            //     }
            // }

            // if ( moveDirection != "" ) {
            //     console.log('before moveLastInDirection' + moveDirection);
            //     moveLastInDirection(moveDirection);
            // }
            // if ( movePos != "" ) {
            //     moveLastToCell(movePos);
            // }
            document.getElementById("botWindow").src="../images/show001.png";

            var audio = new Audio('../audios/sampleCanto_Male2.wav');
            audio.play();       
        }

        if (resp["intents"][0]["intent"] == "findCinema" )
        {
            buildString += "話你聽呢度有咩好玩! 呢度雖然冇戲院，但係我哋今日黃昏時間有live band show!";
            // var deletePosition = "";

            // for ( var i = 0; i < entities.length; i++ ) {
            //     if ( entities[i]["type"] == "builtin.number") {
            //         deletePosition = entities[i]["entity"];
            //         buildString += " [ Position: " + entities[i]["entity"] + "] ";
            //     }
            // }

            // if ( deletePosition != "") {
            //     delCell(deletePosition);
            // }
            document.getElementById("botWindow").src="../images/show001.png";

            var audio = new Audio('../audios/sampleCanto_Male3.wav');
            audio.play(); 
        }

        if (resp["intents"][0]["intent"] == "findShop" )
        {
            buildString += "幫你搜羅最啱你買嘢嘅店鋪!";
            document.getElementById("botWindow").src="../images/shop001.png";

            var audio = new Audio('../audios/sampleCanto_Male4.wav');
            audio.play(); 
        }

        if (resp["intents"][0]["intent"] == "None" )
        {
            buildString += "唔好意思，我暫時未諗到可以點幫你 :(";
            document.getElementById("botWindow").src="../images/robotSorry.png";

            var audio = new Audio('../audios/sampleCanto_Male5.wav');
            audio.play(); 
        }

        $("#txtIntent").val(buildString);

    };

    function sendPhraseToLUIS(phrase2intent)
    {
        $('#spinIntent').css('visibility', 'visible');
        $.ajax({
            url: '/luis?q=' + phrase2intent,
            type: "GET",
            data: null,
        })
        .done(function(data) {
            $('#spinIntent').css('visibility', 'hidden');
            $('#spinPhrase').css('visibility', 'hidden');
            var stringy = JSON.stringify(data, null, 4);
            intentReceived(stringy);
        })
        .fail(function() {
            $('#spinIntent').css('visibility', 'hidden');
            $('#spinPhrase').css('visibility', 'hidden');
            $("#txtIntent").val("I'm sorry, I encountered an error while deducing your intent :(");
        });
    }

    function showPhrase(output) {
        if ( output == "" || output == undefined || output == "undefined" ) {
            $("#txtPhrase").val("I couldn't understand. Please try again...");
            $('#spinIntent').css('visibility', 'hidden');
            $('#spinPhrase').css('visibility', 'hidden');
        } else {
            $("#txtPhrase").val(output);
            sendPhraseToLUIS(output);
        }
    }

    window.btnRecordDown = function (e) {

        $('#btnRecord').removeClass('btnup').addClass('btndown');
        $('#spinIntent').css('visibility', 'hidden');
        $('#spinPhrase').css('visibility', 'hidden');
        $("#txtPhrase").val("");
        $("#txtIntent").val("");

        // START CLIENT SIDE AUDIO RECORDING PROCESS
        if (!audioRecorder) return;
        audioRecorder.clear();
        audioRecorder.record();

        isRecording = true;
    };

    window.btnRecordOut = function (e) {
        if (isRecording)
            btnRecordUp(e);
    }

    window.btnRecordUp = function (e) {
        isRecording = false;
        $('#btnRecord').removeClass('btndown').addClass('btnup');

        $('#spinPhrase').css('visibility', 'visible');
        audioRecorder.stop();
        audioRecorder.getBuffers(gotBuffers);

        // EVENTUALY, WE WILL DO THIS AT THE END:
        // updateGrid();
    };

    function callbackReceivedAudioStream(stream) {

        inputPoint = audioContext.createGain();

        realAudioInput = audioContext.createMediaStreamSource(stream);
        audioInput = realAudioInput;
        audioInput.connect(inputPoint);

        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 2048;
        inputPoint.connect( analyserNode );

        audioRecorder = new Recorder( inputPoint );

        zeroGain = audioContext.createGain();
        zeroGain.gain.value = 0.0;
        inputPoint.connect( zeroGain );
        zeroGain.connect( audioContext.destination );
    };

    function initAudio() {

        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!navigator.cancelAnimationFrame)
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
        if (!navigator.requestAnimationFrame)
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

        navigator.getUserMedia(
            {
                "audio": {
                    "mandatory": {
                        "googEchoCancellation": "false",
                        "googAutoGainControl": "false",
                        "googNoiseSuppression": "false",
                        "googHighpassFilter": "false"
                    },
                    "optional": []
                },
            }, callbackReceivedAudioStream, function (e) {
                alert('Error getting audio');
                console.log(e);
            });
    };


    function main() {
        setupGridData();
        initAudio();
    };

    window.addEventListener('load', main);

})(this);
