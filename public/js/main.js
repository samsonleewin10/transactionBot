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

        var buildString = "Understood...";

        var entities = resp["entities"];
        
        // PROCESS THE JSON FOR INTENT AND ENTITIES
        if ( resp["intents"][0]["intent"] == "PurchaseStocks") {
            

            var StockName = "";
            var ShareQuantity = "";

            for ( var i = 0; i < entities.length; i++ ) {
                if ( entities[i]["type"] == "StockName") {
                    StockName = entities[i]["entity"];
                }
                if ( entities[i]["type"] == "builtin.number") {
                    ShareQuantity = entities[i]["entity"];
                }
            }

            if (StockName == ""){
                // CONFIGURE THE TEXT REPLY FROM BOT
                buildString += "Which stocks would you like to purchase?";
            
                // IMAGE TO BE SHOWN FOR THIS REPLY
                document.getElementById("botWindow").src="../images/restaurant001.png";
            
                // PLAY DEFAULT AUDIO BY THE BOT
                var audio = new Audio('../audios/female_eng_WhichStock.mp3');
                audio.play();
            }
            else if (ShareQuantity ==""){
                if(StockName == ""){
                    // CONFIGURE THE TEXT REPLY FROM BOT
                    buildString += "Which stocks would you like to purchase?";
            
                    // IMAGE TO BE SHOWN FOR THIS REPLY
                    document.getElementById("botWindow").src="../images/restaurant001.png";
            
                    // PLAY DEFAULT AUDIO BY THE BOT
                    var audio = new Audio('../audios/female_eng_WhichStock.mp3');
                    audio.play();
                }
                else{
                    // CONFIGURE THE TEXT REPLY FROM BOT
                    buildString += "How many shares would you like to purchase?";
            
                    // IMAGE TO BE SHOWN FOR THIS REPLY
                    document.getElementById("botWindow").src="../images/restaurant001.png";
            
                    // PLAY DEFAULT AUDIO BY THE BOT
                    var audio = new Audio('../audios/female_eng_HowManyShares.mp3');
                    audio.play();
                }
            }
            else{
                if (StockName == "microsoft"){
                    // CONFIGURE THE TEXT REPLY FROM BOT
                    buildString += ShareQuantity + " shares of Microsoft's stocks have been purchased. It is my pleasure to serve you here. Anything else I can help?";
            
                    // IMAGE TO BE SHOWN FOR THIS REPLY
                    document.getElementById("botWindow").src="../images/restaurant001.png";
            
                    // PLAY DEFAULT AUDIO BY THE BOT
                    var audio = new Audio('../audios/female_eng_TranSucceed.mp3');
                    audio.play();   
                }
                else{
                    // CONFIGURE THE TEXT REPLY FROM BOT
                    buildString += "We don't have such stock at our database at the moment. Please try again later.";
            
                    // IMAGE TO BE SHOWN FOR THIS REPLY
                    document.getElementById("botWindow").src="../images/robotSorry.png";
            
                    // PLAY DEFAULT AUDIO BY THE BOT
                    var audio = new Audio('../audios/female_eng_NoStock.mp3');
                    audio.play();   
                }
            }
        }

        // ACTIONS SET FOR COMMANDS THAT CANNOT BE RECOGNIZED
        if (resp["intents"][0]["intent"] == "None" )
        {
            buildString += "I'm sorry. I cannot understand your command at this moment. Please try again :(";
            document.getElementById("botWindow").src="../images/robotSorry.png";

            var audio = new Audio('../audios/female_eng_Sorry.mp3');
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
