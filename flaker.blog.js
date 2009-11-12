

function flaker_c(options){
	/*
	
	http://flaker.pl/api/type:url2hash/format:json/comments:true/url:aHR0cDovL3Bvem5hbi5iYXJjYW1wLnBsLzIwMDkvMDcvMTMvcGxlbmVyb3d5LWJhcmNhbXAxNy1pLWZsYWtwYXJ0eS1qdXotemEtbmFtaS8,/title:UGxlbmVyb3d5IEJhcmNhbXAjMTcgaSBGbGFrUGFydHkganXFvCB6YSBuYW1p?jsoncallback=jsonp1248222819089&_=1248222820274

	*/
		
	if(typeof(jQuery.metadata)=="undefined"){
		(function($){$.extend({metadata:{defaults:{type:'class',name:'metadata',cre:/({.*})/,single:'metadata'},setType:function(type,name){this.defaults.type=type;this.defaults.name=name;},get:function(elem,opts){var settings=$.extend({},this.defaults,opts);if(!settings.single.length)settings.single='metadata';var data=$.data(elem,settings.single);if(data)return data;data="{}";if(settings.type=="class"){var m=settings.cre.exec(elem.className);if(m)data=m[1];}else if(settings.type=="elem"){if(!elem.getElementsByTagName)return;var e=elem.getElementsByTagName(settings.name);if(e.length)data=$.trim(e[0].innerHTML);}else if(elem.getAttribute!=undefined){var attr=elem.getAttribute(settings.name);if(attr)data=attr;}if(data.indexOf('{')<0)data="{"+data+"}";data=eval("("+data+")");$.data(elem,settings.single,data);return data;}}});$.fn.metadata=function(opts){return $.metadata.get(this[0],opts);};})(jQuery);
	}
	
	this.READONLY = false;
	this.BASE_URL = 'http://flaker.pl/';
	this.entry_hash = false;
	this.entry_id = 0;
	this.traker = [];
	this.likes = [];
	this.refs = {};
	this.host = document.location.host;
	this.datasource = [];
	this.elements = 0;
	
	var defaults = {
		url : document.location.href, 
		title: document.title,
		target : "body", 
		show_favs : 1,
		show_comments : 1,
		show_reactions : 1,
		show_visits : 1,
		show_rss : 0,
		form_add : true,
		show_flaker_button : 1,
		debug : false,
		widget_class : "flaker_c",
		list_class : "flaker_c_list", 
		form_class : "flaker_c_form", 
		form_width : "500px",
		sort : "desc",
		prevent_float : true,
		height: "auto",
		bg : "#fff",
		border : "#f0f0f0",
		timestamp : 0,
		lang_success : "komentarz został dodany",
		lang_commented : "skomentował",
		lang_quoted : "cytował"};
		
	this.defaults = defaults;
	this.options = jQuery.extend(defaults, options);
	this.UID = this.fencode(this.options.url);
	if(document.location.host == 'wp.flaker.pl'){
		this.API_URL = 'http://staging.flaker.pl/api';
	}else{
		this.API_URL = 'http://api.flaker.pl/api';
	}
}



flaker_c.prototype.blog_init = function(){
	var obj = this;
	
	this.scope = jQuery(obj.options.target);
	this.options.form_width = this.correct_size(this.options.form_width);
	this.options.height = this.correct_size(this.options.height);
	
	if(this.scope.length){
		this.debug("target found - init");
		this.show_widget();
		
		this.run();
	}else{
		this.debug("target not found");
	}
	
	this.deconstruct();
}

flaker_c.prototype.frame_init = function(){
	var obj = this;
	this.debug("frame init");
	this.visTrigger();
	this.bind_form();
	this.deconstruct();
}

flaker_c.prototype.deconstruct = function(){
	var obj = this;
	this.debug(obj.options);
	this.debug(obj.refs);
	this.debug(this.datasource);
	
	
	jQuery("li:last", obj.refs["container"]).addClass("last");
}

flaker_c.prototype.show_widget = function(){
	var obj = this;
	this.scope.addClass(obj.options.widget_class);
	this.scope.css({width : obj.options.form_width, 
				backgroundColor : obj.correct_color("bg")});
				
	this.show_heading();
	
	/*lets apply styling*/
	
	var border = this.correct_color("border");
	
	this.refs["heading"].css({backgroundColor : border});
	this.scope.css({borderColor: border});
	
	if(this.options.prevent_float){
		var div = jQuery("<div></div>");
		div.addClass("flaker_c_clearing");
		div.css({width: '100%',
				height: '0px',
				cssFloat : 'none',
				styleFloat : 'none',
				clear : 'both'
				});
		this.scope.before(div).after(div);
	}
	
}

flaker_c.prototype.show_heading = function(){

	var obj = this;

	var button = this.build_button({
		b_class : "with_icon flaker",
		b_text : "Reakcje na Flakerze",
		b_url: "http://flaker.pl/"});
	
	var button_holder = obj.embed_button(button, {h_class : 'flaker_c_heading'}) ;

	this.scope.prepend(button_holder);
	this.refs["heading"] = button_holder;
	
}

flaker_c.prototype.run = function(){
	var obj = this;
	
	if(this.entry_hash == false){
	
		var config = {type:'url2hash',
								url:this.UID,
								title:this.fencode(this.options.title),
								timestamp:this.options.timestamp};
								
		this.debug(config);
		
		jQuery.getJSON(obj.build_url(config) + '?jsoncallback=?',
					function(result){
					
						obj.debug(result);
						
						obj.entry_id = result.entry_id;
						obj.entry_hash = result.entry_hash;
						
						/*let's start building things up!*/

						obj.tasks();
						
					}
		);
	}else{
		this.debug("running readonlymode");
		this.READONLY = true;
		this.tasks();
	}					
	
}

flaker_c.prototype.tasks = function(){

	var obj = this;
	jQuery("a.flaker",obj.refs["heading"]).attr('href',obj.BASE_URL + "t/" + obj.entry_hash);
	this.show_flaker_button();
	this.get_form();
	this.get_data();	
	this.visTrigger(this.scope);

}

flaker_c.prototype.show_flaker_button = function(){

	
	var obj = this;
	var target = jQuery(obj.options.target);

	if(this.options.show_flaker_button){
	
		var container = jQuery("<div></div>");
		container.addClass("flaker_c_recommend");
		
		var button = this.build_button({
		b_class : "with_icon flaker",
		b_text : "Poleć ten wpis znajomym",
		b_url : "http://flaker.pl/add2flaker.php"});
		
		container.append(button);
		target.before(container);
	
		button.bind("click", function(e){
			e.preventDefault();	
			var share_container = jQuery("#flaker_share_container");
			if(share_container.length){
				share_container.show();
			}else{
				obj.show_bookmarklet();
			}
		});
		
		this.refs["addbutton"] = button;
	}
}


flaker_c.prototype.get_form = function(){
	var obj = this;
	var target = jQuery(obj.options.target);
	
	if(this.options.form_add){
	
		/*var button = jQuery("<input type='submit'/>");
		button.addClass("fright vistrigger {target:'#"+obj.get_gen_id()+"'}");
		button.val("skomentuj wpis na flakerze");
		*/
		
	
		var button = this.build_button({
		b_class : "fullw vistrigger {target:'#"+obj.get_gen_id()+"'}",
		b_text : "&#8259; dodaj swój komentarz",
		b_url: "#"});
			
			
		this.scope.append(button);
		
		var iframe = jQuery("<iframe ></iframe>");
		iframe.attr({id : obj.get_gen_id(),
					name : obj.get_gen_id(),
					scrolling: 'auto'					
					});
		iframe.addClass(obj.options.form_class);
		iframe.attr('src',  obj.build_url({
				type:'commentsform', 
				hash:obj.entry_hash, 				
				entry_id:obj.entry_id,
				format:'html'}));
		iframe.css({'width':obj.options.form_width});
		target.append(iframe);
		
		this.refs["iframe"] = iframe;
		this.refs["commentbutton"] = button;
	}
}




flaker_c.prototype.get_data = function(){
	var obj = this;	
	
	
	if(typeof(this.options.datasource)=="undefined"){
		this.debug("local datasource not found!");
		jQuery.getJSON(obj.build_url({type:'flakosfera', 
									tag: obj.entry_hash, 
									avatars : '32px'})+'?jsoncallback=?',
					function(result){
						obj.debug("results fetched - parsing");
						obj.parse_json(result);
					}
		);
	}else{
		this.debug("using api datasource");
		this.parse_json(this.options.datasource);
		
	}
	
}

flaker_c.prototype.parse_json = function(json){
	var obj = this;
	var datasource = [];	

	if(typeof(json.entries)!="undefined"){
	
		var entries  = json.entries;
	
		jQuery.each(entries, function(i, entry){
			obj.debug("parsing entry: id="+entry.id+ " source="+entry.source+" subsource="+entry.subsource);
			
			switch(entry.subsource){
			
				case 'flaker_trakermerged':
					obj.debug("parsing flaker_trakermerged - comments");
					datasource = jQuery.merge(datasource, entry.comments);	
				break;
				case 'internal_traker':
					obj.debug("parsing internal_traker");
					obj.traker.push(entry);	
				break;
				case 'greader_entry':
					obj.likes.push(entry);
					datasource = jQuery.merge(datasource, entry.comments);	
				break;
				case 'delicious_link':
					obj.likes.push(entry);
					datasource = jQuery.merge(datasource, entry.comments);	
				break;
				case 'rss_entry':
					obj.debug("parsing rss_entry - comments");
					if(obj.options.show_rss){
						datasource.unshift(entry);
					}
					datasource = jQuery.merge(datasource, entry.comments);
				break;
				case 'flaker_external':
					obj.debug("parsing flaker_external - comments");
					datasource = jQuery.merge(datasource, entry.comments);
				break;
				default:
					datasource.push(entry);
					datasource = jQuery.merge(datasource, entry.comments);	
			}
			
		});
		
		this.debug("datasource parsing completed: in=" +entries.length+" out=" +datasource.length);
		this.datasource = datasource;
		this.build_list();
		
	}
}

flaker_c.prototype.build_list = function(){

	var obj = this;
	var datasource = this.datasource;
	var container = jQuery("<ol></ol>");
	
	if(this.options.height == 'auto'){
		if(datasource.length > 3){
			container.css({height :  "150px",
						overflow: 'auto'
					});
		}else{
			container.css({height : "auto" ,
					   overflow: 'visible'
					});
		}
	}else if (this.options.height == 'full') {
	
		container.css({height : "auto" ,
					   overflow: 'visible'
					});
	
	}else{
		
		if(datasource.length < 2){
			container.css({height : 'auto', 
					   overflow: 'visible'
					  });
		}else{
			container.css({height : obj.options.height, 
					   overflow: 'auto'
					  });
		}
		
	}
	
	container.attr({"class":obj.options.list_class});
	container.css({"width": obj.options.form_width});
	
	this.refs["container"] = container;
	this.scope.append(container);
	
	this.parse_comments();
	
	this.parse_likes();
	this.parse_trakers();
	
}
	

flaker_c.prototype.parse_comments = function(datasource){
	var obj = this;
	var datasource = this.datasource;
	if(datasource.length){
	
		jQuery.each(datasource,function(i,c){
		
			if(obj.options.sort == "asc"){
				obj.refs["container"].append( obj.parse_comment(c) );
			}else{
				obj.refs["container"].prepend( obj.parse_comment(c) );
			}	
			
		});
		
	}else{
		this.debug("error: comments parsing failed!");
	}

}


flaker_c.prototype.parse_comment = function(c){

	var obj = this;
	
	this.debug("parsing comment: type=" + c.subsource);
	
	if(c.subsource == 'internal_favorited'){
		this.likes.push(c);
	}else{
		if(c.subsource == "internal_comment"){
			return this.build_internal_entry(c);
		}else{
			return this.build_entry(c);
		}
	}
}

flaker_c.prototype.build_entry = function(c){
	
	var obj = this;
	var av = '<img src="'+this.change_avatar(c.user.avatar, 32)+'" alt="avatar" />';
	var action = '';
	
	switch (c.subsource){
		case 'flaker_link':
		case 'blip_status':
		case 'twitter_status':
		case 'pinger_status':
			var action = obj.options.lang_quoted;
		break;
		default:
			//var action = obj.options.lang_commented;
	}
	
	return '<li class="'+c.subsource+'">'+
		'<span class="fleft flaker_c_avatar"><a href="'+c.user.url+'">'+av+ '</a></span> '+
		'<span class="fleft flaker_c_author"><a href="'+c.user.url+'">'+c.user.login+'</a> '+action+'</span> ' +
		'<span class="fright flaker_c_date"><a href="'+c.permalink+'">'+c.datetime+'</a></span> ' +
		'<span class="fleft flaker_c_text">'+c.text+'</span>'+
		'</li>';

}


flaker_c.prototype.build_internal_entry = function(c){
	
	var obj = this;
	
	var av = '<img src="'+this.change_avatar(c.user.avatar, 16)+'" alt="avatar" />';
	
	return '<li class="internal_comment">'+
		'<span class="fleft flaker_c_avatar"><a href="'+c.user.url+'">'+av+ '</a></span> '+
		'<span class="fleft flaker_c_author"><a href="'+c.user.url+'">'+c.user.login+'</a></span> ' +
		'<span class="fleft flaker_c_text">'+c.text+'</span>'+
		'<span class="fleft flaker_c_date"><a href="'+c.permalink+'" title="'+c.datetime+'">flak</a></span> ' +
		'</li>';
	
}

flaker_c.prototype.parse_trakers = function(){
	
	var obj = this;

	this.debug("trakers found: " + this.traker.length);
	
	if(this.options.show_visits && this.traker.length){
			this.debug("append traker");
			this.debug(this.traker);
			var t = jQuery("<li></li>");
			t.addClass("visitors");
			t.html('<span class="traker with_icon flaker_c_visitors">odwiedzili:</span> ');
			
			var list = this.build_userlist(this.traker);
			t.append(list);
			this.refs["container"].append(t);
			this.refs["traker"] = t;
	}
	
}

flaker_c.prototype.parse_likes = function(){

	var obj = this;
	
	this.debug("likes found: " + this.likes.length);
	
	if(this.options.show_favs && this.likes.length){
		this.debug("append likes");
		this.debug(this.likes);
		var l = jQuery("<li></li>");
		l.addClass("likings");
		
		l.html('<span class="love with_icon flaker_c_likings">polecili:</span> ');
		
		var list = this.build_userlist(this.likes);
		l.append(list);
		
		this.refs["container"].append(l);
		this.refs["likes"] = l;
	}
}

flaker_c.prototype.build_userlist = function(source){

		var obj = this;
		var users = [];
		var html = '<span class="userlist">';
		
		jQuery.each(source, function(i, u){
			
			if(jQuery.inArray(u.user.login, users) < 0){
					html += "<a href='"+u.user.url+"' title='"+u.user.login+"'>"+
					"<img src='"+obj.change_avatar(u.user.avatar, 16)+"' alt='avatar "+u.user.login+"' />"+
					"</a>";
			}
			users.push(u.user.login);
		});
		return html + '</span>';
}

flaker_c.prototype.show_bookmarklet = function(){
	var obj = this;
	e=document.createElement('script');
	e.setAttribute('type','text/javascript');
	e.setAttribute('src','http://flaker.pl/static/js/flaker/share.js?url='+obj.UID);
	document.body.appendChild(e);
}

/****************************************************/
/***************   HELPER FUNCTIONS   ***************/
/****************************************************/


flaker_c.prototype.parse_params = function(scriptname){
	var obj = this;
	var parameters = []; /*{ref key val}*/
	var scripts = jQuery("script");
	scripts.each(function(script){
		var s = jQuery(this);
		var src = s.attr("src");
		if(src.indexOf(scriptname) > -1){
			//todo :)
		}
	});
}

flaker_c.prototype.get_gen_id = function(){
	var id= this.options.target.replace(/#/gi,"");
	return "flaker_c_"+id;
}


flaker_c.prototype.debug = function(msg){
	var obj = this;
	if(typeof(console)!="undefined" && parseInt(this.options.debug)){
		console.log(msg);
		if(typeof(msg) == "object" || typeof(msg) == "function"){	
			console.log("output from: " + arguments.callee.caller.toString());
		}
	}
}


flaker_c.prototype.build_url = function(options){
	var obj = this;
	var defaults = {type:"commentslist", format:"json", comments: true, limit: 100};
	var options = jQuery.extend(defaults,options);
	var url = this.API_URL;
	jQuery.each(options,function(k,v){
	  url += '/'+k+':'+v;
	});
	return url;
}

flaker_c.prototype.correct_size = function(str){
	var str = str.replace(/\s/gi, "");
	if(str.search(/(px|em|%|auto)/gi)!=-1){
		return str;
	}else{
		return str + "px";
	}
}

flaker_c.prototype.correct_color = function(key){
	if(this.options[key] == "auto"){
		return this.defaults[key];
	}else{
		return this.options[key];
	}
}

flaker_c.prototype.flashmsg = function(msg){
	var obj = this;
	var msg = msg || "";
	
	var flash = jQuery('<div></div>');
	flash.addClass("flashmsg");
	flash.html(msg);
	
	jQuery(".flaker_c_form").prepend(flash);
	
	if(!this.debug){
		setTimeout(function(){
			flash.hide("slow").remove();
		}, 2000);
	}
}


flaker_c.prototype.bind_form = function(){
	var obj = this;
	jQuery(".ajax").submit(function(e){
		e.preventDefault();
		var ref = jQuery(this);
		var url  = ref.attr("action");
		var type = ref.attr("method");
		var data = ref.serialize();
		var success = function(json){
			if(typeof(json) == "object"){
				if(typeof json.operation != 'undefined'){
					if(!json.operation){
						obj.debug(json.message);
						obj.flashmsg(json.message);
					} else {
						obj.flashmsg(obj.options.lang_success);
					}
				}
			}
		}
		jQuery.ajax({
				type:type,
				url:url,
				dataType:'json',
				success:success,
				data:data
		});
	});
}

flaker_c.prototype.visTrigger = function(scope){
		var obj = this;
		var scope = scope || jQuery(document);
		jQuery(".vistrigger", scope).unbind("click.visTrigger").bind("click.visTrigger", function(e){

			e.preventDefault(); 
		
			var ref = jQuery(this);
			var metadata = ref.metadata();
			var target = jQuery(metadata.target);
			var hideme = ((typeof(metadata.hideme)!="undefined") ? metadata.hideme : false);
			

			if(target.is(":visible")){
				target.animate({opacity: 'hide'},'normal');
			}else{
				if(hideme){ref.hide();}
				target.animate({opacity: 'show'},'normal');
				target.find(".focus:first").trigger("focus");
			}
		});
}


flaker_c.prototype.build_button = function(options, add_flaker_logo){
	var obj = this;
	
	var defaults = {b_class:'',
					b_url : 'http://flaker.pl/',
					b_text : 'button title goes here!'}
	var options = jQuery.extend(defaults, options);

	var button = jQuery("<a></a>");
	
	button.addClass("flaker_c_button");
	button.addClass(options.b_class);
	
	button.attr({'href': options.b_url});
	button.html(options.b_text);
	
	return button;
}


flaker_c.prototype.embed_button = function(button, options){

	var obj = this;
	
	var defaults = {h_class:''}
	var options = jQuery.extend(defaults, options);
	
	var button_holder = jQuery('<div></div>');
	button_holder.addClass("fullw");
	button_holder.addClass(options.h_class);
	button_holder.append(button);

	return button_holder;
}



flaker_c.prototype.change_avatar = function(path, size){
	if(typeof(path)=='string' && parseInt(size) > 15){
		return path.replace(/_(16|32|50|80)\.jpeg/gi, "_"+size+".jpeg");
	}else{
		return path;
	}
}


flaker_c.prototype.fencode = function(str){
		var string = Base64.encode(str);			
		string = string.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ",");
		return string;
}

flaker_c.prototype.bind_switch_user = function(){
	jQuery("#switchUserButton").click(function(e){
		e.preventDefault();
		var ref = jQuery(this);
		var a = jQuery("#anonymous");
		var c = jQuery("#credentials");
		var is_c = c.is(":visible");
		a.slideToggle();
		c.slideToggle();
		if(is_c){
		  var t = "zaloguj się";
		} else {
		  var t = "dodaj bez logowania";
		}
		ref.html(t);
	});	
}





var Base64 = { 
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode : function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = Base64._utf8_encode(input);
        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output +
            this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
            this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }
        return output;
    },
    _utf8_encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    }
};
