<?php
/*
	Plugin Name: flakpress
	Plugin URI: http://blog.flaker.pl/flakpress
	Description: Plugin wyświetla reakcje na twoje posty i pozwala komentować w serwisie Flaker.pl, magic by netguru
	Version: 0.3
*/



// Odpalanie pluginu
add_action('init', 'flaker_c_start');

// Opcje pluginu 
register_activation_hook('flakpress/flakpress.php', "flaker_c_set_options");
register_deactivation_hook('flakpress/flakpress.php', "flaker_c_unset_options");

function flaker_c_start() {

	// Menu
	add_action('admin_menu', 'flaker_c_menu');
  
	if(get_option('flaker_c_is_active')){
		// Załaczanie plików js
		add_action('wp_head', 'flaker_c_init_header');

		if(get_option('flaker_c_comments_position') == 'replace'){
			add_filter("comments_template","flaker_c_disable_wp_comments");
		}

		if(get_option('flaker_c_comments_position') == 'under'){
			//tego też nie
		} else {
		// Wyświetlanie ogłoszeń pod wpisami, nad komciami
			add_filter('the_content', 'flaker_c_insert_code');
		}
	}

}


function flaker_c_json_encode($arr){

	if(!empty($arr) && function_exists("json_encode")){
		return json_encode($arr);
	}
}

function flaker_c_disable_wp_comments(){
 return ABSPATH . "wp-content/plugins/flakpress/blank.php";
}

// Ustawianie zmiennych
function flaker_c_set_options() {
	add_option('flaker_c_is_active', 1);
	add_option('flaker_c_form_width', "600px");
	add_option('flaker_c_form_add', 1);
	add_option('flaker_c_show_visits', 1);
	add_option('flaker_c_show_favs', 1);
	add_option('flaker_c_show_comments', 1);
	add_option('flaker_c_show_reactions', 1);
	add_option('flaker_c_show_flaker_button', 1);
	add_option('flaker_c_debug', 0);
	
	add_option('flaker_c_comments_position','above');
	add_option('flaker_c_height','auto');
	add_option('flaker_c_bg','#fff');
	add_option('flaker_c_anonim',1);
	
	add_option('flaker_c_sort','asc');
	
	add_option('flaker_c_singlemode', 1);
	
	add_option('flaker_c_border','auto');
}

// Kasowanie zmiennych
function flaker_c_unset_options() {
  delete_option('flaker_c_is_active');
  delete_option('flaker_c_form_width');
	delete_option('flaker_c_form_add');
	delete_option('flaker_c_show_visits');
	delete_option('flaker_c_show_favs');
	delete_option('flaker_c_show_comments');
	delete_option('flaker_c_show_reactions');
	delete_option('flaker_c_show_flaker_button');
	delete_option('flaker_c_debug');
	
	delete_option('flaker_c_comments_position');
	delete_option('flaker_c_height');
	delete_option('flaker_c_bg');
	delete_option('flaker_c_anonim');

	delete_option('flaker_c_sort');
	
	delete_option('flaker_c_singlemode');
	
	delete_option('flaker_c_border');
}

function _flaker_read_options($list = array()){
  $conf = array();
  foreach($list as $name){
    $v = get_option('flaker_c_'.$name);
    if($v == "1" || $v == "0"){
      $v = intval($v);
    }
  	$conf[$name] = $v;
  }
  return $conf;
}

function flaker_c_insert_code($html) {
  global $post;
  #var_dump($post);
  if(!is_feed() && get_option('flaker_c_is_active') && !empty($post) && (!get_option('flaker_c_singlemode') || is_singular())) {  
    $conf = _flaker_read_options(array("form_add","show_visits","form_width","show_favs","show_comments",
                                        "show_reactions","show_flaker_button","debug","comments_position",
                                        "height","bg","anonim","sort","singlemode","border"));
                                        
    if(empty($conf["height"])){
     $conf["height"] = "auto";
    }                                  
    if(!empty($post->post_title)){
      $conf["title"] = $post->post_title;
    }
    if(!empty($post->ID)){
      $conf["url"] = get_permalink($post->ID);
    }
    
    if(!empty($post->post_date_gmt)){
      $conf["timestamp"] = strtotime($post->post_date_gmt);
    }
  
    if(!empty($post->post_status) && $post->post_status != "publish"){
      return "";
    }
    
    $conf["target"] = "#flaker_c_container_".$post->ID;

    $var = 'flaker_c_init_'.$post->ID;

    $flaker_c_code  = '<div id="'.substr($conf["target"], 1).'"></div>'."\n";
    $flaker_c_code .= '<script type="text/javascript">
                    jQuery(function(){
    	                var '.$var.' = new flaker_c('.flaker_c_json_encode($conf).');
    	                '.$var.'.blog_init();
  	                });
                    </script>';
    $html .= $flaker_c_code;
  }	
	return $html; 
}

function flaker_c_init_header() {

  if(!is_feed() && get_option('flaker_c_is_active') && (!get_option('flaker_c_singlemode') || is_singular())) {  
	$url = get_bloginfo('wpurl');
	$debug = get_option('flaker_c_debug');
	$path = "/wp-content/plugins/flakpress/";
	
echo '<!-- Flaker Plugin -->' . "\n";
echo '<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js" type="text/javascript"></script>' . "\n";
	
if($_SERVER["HTTP_HOST"] == "wp.flaker.pl"){
	
	echo '<script src="http://staging.flaker.pl/static/js/flaker/flaker.blog.js" type="text/javascript"></script>' . "\n";
	echo '<link href="http://staging.flaker.pl/static/css/flaker/widgets.css" rel="stylesheet" type="text/css" media="screen" />' . "\n";

}else{

	echo '<script src="'.$url.$path.'flaker.blog.js" type="text/javascript"></script>' . "\n";
	echo '<link href="'.$url.$path.'widgets.css" rel="stylesheet" type="text/css" media="screen" />' . "\n";

}
	
  echo '<!-- end Flaker Plugin -->' . "\n";
  }
}

// Menu flaker'a
function flaker_c_menu() {
	// Add a new top-level menu (ill-advised):
	add_options_page('Flakpress', 'Flakpress', 8, __FILE__, 'flaker_c_settings_page');
}

function _flaker_c_update_settings($name,$boolean = true){
  if($boolean){
   $active = isset($_POST[$name]) && $_POST[$name];
   update_option($name,intval($active));
  } else {
    if(isset($_POST[$name])){
     update_option($name,$_POST[$name]);
    }
  }
}

function flaker_c_settings_page() {
  if(!empty($_POST)) {
    _flaker_c_update_settings("flaker_c_is_active");
    _flaker_c_update_settings("flaker_c_form_width",false);
    _flaker_c_update_settings("flaker_c_form_add");
    _flaker_c_update_settings("flaker_c_show_visits");
    _flaker_c_update_settings("flaker_c_show_favs");
    _flaker_c_update_settings("flaker_c_show_comments");
    _flaker_c_update_settings("flaker_c_show_reactions");
    _flaker_c_update_settings("flaker_c_show_flaker_button");
    _flaker_c_update_settings("flaker_c_debug");
    _flaker_c_update_settings("flaker_c_comments_position",false);
  
    _flaker_c_update_settings("flaker_c_height",false);
    _flaker_c_update_settings("flaker_c_bg",false);
    _flaker_c_update_settings("flaker_c_anonim");
	
	  _flaker_c_update_settings("flaker_c_sort",false);
	
	  _flaker_c_update_settings("flaker_c_singlemode");
	   
	  _flaker_c_update_settings("flaker_c_border",false);
  }

	
	$html = '<div id="flaker-wpplugin">
		<h2>Parametry pluginu</h2>
		<form id="flaker-wpplugin-form" name="flaker-wpplugin-form" action="" method="post">
		<table class="form-table"><tbody>';
		
	$html .= '<tr><th scope="row"><label for="flaker_c_is_active">Wtyczka jest aktywna?</label></th>'; 
	$html .= '<td><input type="checkbox" value="1" id="flaker_c_is_active" name="flaker_c_is_active" '.(get_option('flaker_c_is_active')?'checked="checked"':'').'  /></td><tr>';
	
	$html .= '<tr><th scope="row"><label for="flaker_c_form_add">Pokazać formularz komentowania?</label></th>'; 
	$html .= '<td><input type="checkbox" value="1"  id="flaker_c_form_add" name="flaker_c_form_add" '.(get_option('flaker_c_form_add')?'checked="checked"':'').'  /></td><tr>';
	
	$html .= '<tr><th scope="row"><label for="flaker_c_form_width">Szerokość ramki dodawania:</label></th>'; 
	$html .= '<td><input type="text" id="flaker_c_form_width" name="flaker_c_form_width" value="'.get_option('flaker_c_form_width').'"/></td><tr>';
	
	$html .= '<tr><th scope="row"><label for="flaker_c_show_visits">Pokazać pojedyńcze odwiedziny?</label></th>'; 
	$html .= '<td><input type="checkbox" value="1"  id="flaker_c_show_visits" name="flaker_c_show_visits" '.(get_option('flaker_c_show_visits')?'checked="checked"':'').'  /></td><tr>';
	
	$html .= '<tr><th scope="row"><label for="flaker_c_show_favs">Pokazać oceny?</label></th>'; 
	$html .= '<td><input type="checkbox"  value="1" id="flaker_c_show_favs" name="flaker_c_show_favs" '.(get_option('flaker_c_show_favs')?'checked="checked"':'').'  /></td><tr>';
	
	$html .= '<tr><th scope="row"><label for="flaker_c_show_comments">Pokazać komentarze?</label></th>'; 
	$html .= '<td><input type="checkbox" value="1"  id="flaker_c_show_comments" name="flaker_c_show_comments" '.(get_option('flaker_c_show_comments')?'checked="checked"':'').'  /></td><tr>';

	$html .= '<tr><th scope="row"><label for="flaker_c_show_reactions">Pokazać cytowania?</label></th>'; 
	$html .= '<td><input type="checkbox" value="1"  id="flaker_c_show_reactions" name="flaker_c_show_reactions" '.(get_option('flaker_c_show_reactions')?'checked="checked"':'').'  /></td><tr>';	
	
	$html .= '<tr><th scope="row"><label for="flaker_c_show_flaker_button">Pokazać przycisk dodaj na flakera?</label></th>'; 
	$html .= '<td><input type="checkbox"  value="1" id="flaker_c_show_flaker_button" name="flaker_c_show_flaker_button" '.(get_option('flaker_c_show_flaker_button')?'checked="checked"':'').'  /></td><tr>';
	
	
	$html .= '<tr><th scope="row"><label for="flaker_c_debug">Włączyć debugowanie?</label></th>'; 
	$html .= '<td><input type="checkbox"  value="1" id="flaker_c_debug" name="flaker_c_debug" '.(get_option('flaker_c_debug')?'checked="checked"':'').'  /></td><tr>';
	
	$html .= '<tr><th scope="row"><label for="flaker_c_comments_position">Pokazywać reakcje:</label></th>'; 
	$html .= '<td><select type="text" id="flaker_c_comments_position" name="flaker_c_comments_position">
	                <option value="above" '.(get_option('flaker_c_comments_position')=='above'?'selected="selected"':'').'>nad komentarzami z WP</option>'
	                .'<option value="replace" '.(get_option('flaker_c_comments_position')=='replace'?'selected="selected"':'').'>zamiast komentarzy z WP</option>
	              </select></td><tr>';
	              
	  	                #'.<option value="under" '.(get_option('flaker_c_comments_position')=='under'?'selected="selected"':'').'>pod komentarzami z WP</option>'
	
	$html .= '<tr><th scope="row"><label for="flaker_c_height">Wysokość (xx px lub auto):</label></th>'; 
	$html .= '<td><input type="text" id="flaker_c_height" name="flaker_c_height" value="'.get_option('flaker_c_height').'"/></td><tr>';
	
	$html .= '<tr><th scope="row"><label for="flaker_c_bg">Tło:</label></th>'; 
	$html .= '<td><input type="text" id="flaker_c_bg" name="flaker_c_bg" value="'.get_option('flaker_c_bg').'"/></td><tr>';
	
	
	$html .= '<tr><th scope="row"><label for="flaker_c_anonim">Pozwolić na komentowanie bez logowania?</label></th>'; 
	$html .= '<td><input type="checkbox"  value="1" id="flaker_c_anonim" name="flaker_c_anonim" '.(get_option('flaker_c_anonim')?'checked="checked"':'').'  /></td><tr>';
	

	
	$html .= '<tr><th scope="row"><label for="flaker_c_sort">Sortowanie:</label></th>'; 
	$html .= '<td><select type="text" id="flaker_c_sort" name="flaker_c_sort">
	                <option value="asc" '.(get_option('flaker_c_sort')=='asc'?'selected="selected"':'').'>najnowsze na dole</option>
	                <option value="desc" '.(get_option('flaker_c_sort')=='desc'?'selected="selected"':'').'>najnowsze u góry</option>
	              </select></td><tr>';
	
	
	$html .= '<tr><th scope="row"><label for="flaker_c_singlemode">Tylko na stronie wpisu?</label></th>'; 
	$html .= '<td><input type="checkbox"  value="1" id="flaker_c_singlemode" name="flaker_c_singlemode" '.(get_option('flaker_c_singlemode')?'checked="checked"':'').'  /></td><tr>';
	
	$html .= '<tr><th scope="row"><label for="flaker_c_border">Obramowanie:</label></th>'; 
	$html .= '<td><input type="text" id="flaker_c_border" name="flaker_c_border" value="'.get_option('flaker_c_border').'"/></td><tr>';

	
	$html .= '</tbody></table><p class="submit">
  <input type="submit" name="Submit" class="button-primary" value="Zapisz zmiany" />
  </p></form></div>';
	echo $html;
}


