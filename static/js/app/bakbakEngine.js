define(['jquery','jquery-popup-overlay','app/utils'],function($,popup,utils) {

    $.fn.serializeObject = function() {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };


    window.BakbakEngine = function(debug,visitor) {
        var self = this;
        init = function () {
            if(typeof bakbaks === 'undefined') return;
            if(eval(decodeURI(bakbaks.bakbak_rule))) {
                self.showBakBak(bakbaks);
            } else {
                console.log("No bakbak to process!");
            }
        }

        this.showBakBak = function(bakbak) {
            var bakbakHtml = returnBakbakHtml(bakbak);
            if(bakbak.view_as == 'fullPagePopUp') {
                showFullPagePopUp(bakbakHtml,bakbak.name);
            } else {
                console.log("Incorrect view_as");
            }
        }

        showFullPagePopUp = function(html,subject) {
            console.log("Full page popup");
            $('body').append("<div id='bakbakFullPagePopUp' class='fullPagePopUp bakbak_bootstrap'><div class='bakbakFullPagePopUp_close'><img src='"+bakbakUrl+"img/actions/png/dnd.png' class='imageIconMedium rightAlignIcon'/></div> <div id='bakbakFullPagePopUpContainer'/></div>");
            $("#bakbakFullPagePopUpContainer").html(decodeURI(html));
            $("#bakbakFullPagePopUp").popup({closeelement: '.bakbakFullPagePopUp_close'});
            $("#bakbakFullPagePopUp").popup('show');
            initializeEmailResponses(subject);
        }

        returnBakbakHtml = function(bakbak) {
            console.log("DisplayBakBak");
            var formHtml;
            if(bakbak.type == '0')
                formHtml =returnEmbedForm(bakbak.data);
            else if(bakbak.type == '1') 
                formHtml = returnGoogleForm(decodeURI(bakbak.data));
            else 
                formHtml = returnEmbedForm(decodeURI(bakbak.data));
            return formHtml;
        }

        returnEmbedForm = function(embedCode) {
            return embedCode;
        }

        returnGoogleForm = function(url) {
                var html;
                $.ajax({
                    url: url,
                    success: function(content) {
                                html = content;
                            },
                    async: false
                });
                return html;
        }

        returnDefaultForm = function(msg) {
            console.log("Showing Default Form!");
            var html = new EJS({url: bakbakUrl+'js/tpl/defaultForm.ejs'}).render({displayMsg:msg});
            return html;
        }

        initializeEmailResponses = function(subject) {
            $($('#bakbakFullPagePopUpContainer > form')[0]).on('submit',function(ev) {
                ev.preventDefault();
                self.sendContactUsForm($(this).serializeObject(),subject);
                return true;
            });
        };

        this.sendContactUsForm = function(data,subject) {
            $('#bakbakEmailButton').attr('disabled',true);
            console.log(data);
            toSend = {};
            toSend['email'] = adminEmail;
            toSend['template'] = 'bakbakEmail';
            toSend['data'] = data;
            toSend['subject'] = subject;
            $.post( bakbakUrl + "email",toSend,'json')
                            .done(function(response) {
                                console.log("Attempted to send email");
                                if(response == "OK") {
                                    console.log('Email sent SUCCESS!');
                                    $('#bakbakFullPagePopUpContainer').prepend("<p>Thanks for interest!</p>");
                                    $('#bakbakFullPagePopUpContainer > form')[0].reset();
                                    $('#bakbakEmailButton').removeAttr('disabled');
                                } else {
                                    $('#bakbakFullPagePopUp').append("<p>Error Contacting the Server!</p>");
                                    $('#bakbakEmailButton').removeAttr('disabled');
                                }

                            });
        }

        init();

	};  
}); 