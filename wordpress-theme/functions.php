<?php
/**
 * PSC2 (Pacific Softcom) theme functions.
 *
 * @package PSC2
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'PSC2_VERSION', '1.0.0' );

/**
 * Where form submissions go. Change it under Settings > General > "PSC lead email".
 */
function psc2_lead_email() {
	$email = get_option( 'psc2_lead_email' );
	return is_email( $email ) ? $email : 'PSC@Pacificsoftcom.com';
}

/**
 * URL of a file inside the theme.
 */
function psc2_asset( $path ) {
	return esc_url( get_theme_file_uri( $path ) );
}

/* ------------------------------------------------------------------
 * Theme setup
 * ------------------------------------------------------------------ */
function psc2_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
}
add_action( 'after_setup_theme', 'psc2_setup' );

function psc2_document_title( $title ) {
	if ( is_front_page() ) {
		$title['title']   = 'Pacific Softcom';
		$title['tagline'] = '3CX Phone Systems & SIP Trunking, Long Beach CA';
		unset( $title['site'] );
	}
	return $title;
}
add_filter( 'document_title_parts', 'psc2_document_title' );

function psc2_title_separator() {
	return '|';
}
add_filter( 'document_title_separator', 'psc2_title_separator' );

/* ------------------------------------------------------------------
 * Styles and scripts
 * ------------------------------------------------------------------ */
function psc2_enqueue() {
	wp_enqueue_style(
		'psc2-fonts',
		'https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@500;600;700&family=Figtree:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap',
		array(),
		null
	);
	wp_enqueue_style( 'psc2-style', get_stylesheet_uri(), array( 'psc2-fonts' ), PSC2_VERSION );
	wp_enqueue_script( 'psc2-main', get_theme_file_uri( 'assets/js/main.js' ), array(), PSC2_VERSION, array( 'in_footer' => true, 'strategy' => 'defer' ) );
}
add_action( 'wp_enqueue_scripts', 'psc2_enqueue' );

function psc2_resource_hints( $urls, $relation ) {
	if ( 'preconnect' === $relation ) {
		$urls[] = 'https://fonts.googleapis.com';
		$urls[] = array(
			'href'        => 'https://fonts.gstatic.com',
			'crossorigin' => 'anonymous',
		);
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'psc2_resource_hints', 10, 2 );

/* ------------------------------------------------------------------
 * Head: favicons, meta, structured data
 * ------------------------------------------------------------------ */
function psc2_head_meta() {
	// Theme favicons are used until a Site Icon is set in the Customizer.
	if ( ! has_site_icon() ) {
		?>
		<link rel="icon" href="<?php echo psc2_asset( 'assets/images/favicon.ico' ); ?>" sizes="any">
		<link rel="icon" type="image/png" sizes="32x32" href="<?php echo psc2_asset( 'assets/images/favicon-32x32.png' ); ?>">
		<link rel="icon" type="image/png" sizes="16x16" href="<?php echo psc2_asset( 'assets/images/favicon-16x16.png' ); ?>">
		<link rel="apple-touch-icon" sizes="180x180" href="<?php echo psc2_asset( 'assets/images/apple-touch-icon.png' ); ?>">
		<?php
	}
	?>
	<meta name="theme-color" content="#0C1D30">
	<?php
	if ( ! is_front_page() ) {
		return;
	}
	?>
	<meta name="description" content="Pacific Softcom installs and supports 3CX phone systems, SIP trunks, hotel PMS phone integration and remote office phones. 35 years in the telephone business. Send us your bill for a free review.">
	<meta property="og:title" content="Pacific Softcom | Cut the phone bill. Keep the phones.">
	<meta property="og:description" content="3CX phone systems, SIP trunking and hotel phone integration from a Long Beach team with 35 years in telephony.">
	<meta property="og:type" content="website">
	<meta property="og:image" content="<?php echo psc2_asset( 'assets/images/android-chrome-512x512.png' ); ?>">
	<script type="application/ld+json">
	<?php
	echo wp_json_encode(
		array(
			'@context'    => 'https://schema.org',
			'@type'       => 'LocalBusiness',
			'name'        => 'Pacific Softcom Inc.',
			'description' => '3CX IP phone systems, SIP trunking, hotel PMS phone integration and remote office telephony.',
			'telephone'   => '+1-562-489-7760',
			'email'       => 'PSC@Pacificsoftcom.com',
			'url'         => home_url( '/' ),
			'address'     => array(
				'@type'           => 'PostalAddress',
				'streetAddress'   => '4712 East 2nd Street #831',
				'addressLocality' => 'Long Beach',
				'addressRegion'   => 'CA',
				'postalCode'      => '90803',
				'addressCountry'  => 'US',
			),
		),
		JSON_UNESCAPED_SLASHES
	);
	?>
	</script>
	<?php
}
add_action( 'wp_head', 'psc2_head_meta', 2 );

/* ------------------------------------------------------------------
 * Settings: lead email field under Settings > General
 * ------------------------------------------------------------------ */
function psc2_register_settings() {
	register_setting(
		'general',
		'psc2_lead_email',
		array(
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_email',
			'default'           => 'PSC@Pacificsoftcom.com',
		)
	);
	add_settings_field(
		'psc2_lead_email',
		'PSC lead email',
		function () {
			printf(
				'<input type="email" name="psc2_lead_email" id="psc2_lead_email" class="regular-text" value="%s"><p class="description">Bill review and call-back requests from the front page go to this address.</p>',
				esc_attr( psc2_lead_email() )
			);
		},
		'general'
	);
}
add_action( 'admin_init', 'psc2_register_settings' );

/* ------------------------------------------------------------------
 * Form handlers (admin-post.php)
 * ------------------------------------------------------------------ */
function psc2_redirect_back( $status, $anchor ) {
	$url = wp_get_referer() ? wp_get_referer() : home_url( '/' );
	$url = remove_query_arg( 'psc2', $url );
	$url = preg_replace( '/#.*$/', '', $url );
	wp_safe_redirect( add_query_arg( 'psc2', $status, $url ) . '#' . $anchor );
	exit;
}

function psc2_handle_contact() {
	if ( ! isset( $_POST['psc2_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['psc2_nonce'] ) ), 'psc2_contact' ) ) {
		psc2_redirect_back( 'error', 'contact' );
	}
	// Honeypot: real visitors never see this field.
	if ( ! empty( $_POST['website'] ) ) {
		psc2_redirect_back( 'sent', 'contact' );
	}

	$name    = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
	$company = isset( $_POST['company'] ) ? sanitize_text_field( wp_unslash( $_POST['company'] ) ) : '';
	$email   = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	$phone   = isset( $_POST['phone'] ) ? sanitize_text_field( wp_unslash( $_POST['phone'] ) ) : '';
	$service = isset( $_POST['service'] ) ? sanitize_text_field( wp_unslash( $_POST['service'] ) ) : '';
	$size    = isset( $_POST['size'] ) ? sanitize_text_field( wp_unslash( $_POST['size'] ) ) : '';
	$message = isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '';

	if ( strlen( $name ) < 2 || ! is_email( $email ) || strlen( preg_replace( '/\D/', '', $phone ) ) < 10 ) {
		psc2_redirect_back( 'invalid', 'contact' );
	}

	// Optional phone bill upload: PDF or image, 10 MB max. It is attached to
	// the email and deleted from the server right after sending.
	$attachments = array();
	$bill_note   = 'Bill: not attached';
	if ( ! empty( $_FILES['bill']['name'] ) && UPLOAD_ERR_NO_FILE !== (int) $_FILES['bill']['error'] ) {
		if ( (int) $_FILES['bill']['size'] > 10 * MB_IN_BYTES ) {
			psc2_redirect_back( 'toobig', 'contact' );
		}
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$upload = wp_handle_upload(
			$_FILES['bill'], // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- validated by wp_handle_upload.
			array(
				'test_form' => false,
				'mimes'     => array(
					'pdf'      => 'application/pdf',
					'jpg|jpeg' => 'image/jpeg',
					'png'      => 'image/png',
					'heic'     => 'image/heic',
				),
			)
		);
		if ( isset( $upload['error'] ) ) {
			psc2_redirect_back( 'badfile', 'contact' );
		}
		$attachments[] = $upload['file'];
		$bill_note     = 'Bill: attached (' . basename( $upload['file'] ) . ')';
	}

	$body = implode(
		"\n",
		array(
			'Name: ' . $name,
			'Company: ' . $company,
			'Email: ' . $email,
			'Phone: ' . $phone,
			'Request: ' . $service,
			'Phones on system: ' . ( $size ? $size : 'Not sure' ),
			$bill_note,
			'',
			$message,
		)
	);

	$sent = wp_mail(
		psc2_lead_email(),
		sprintf( '%s request from %s', $service ? $service : 'Website', $name ),
		$body,
		array( 'Reply-To: ' . $name . ' <' . $email . '>' ),
		$attachments
	);

	foreach ( $attachments as $file ) {
		wp_delete_file( $file );
	}

	psc2_redirect_back( $sent ? 'sent' : 'error', 'contact' );
}
add_action( 'admin_post_nopriv_psc2_contact', 'psc2_handle_contact' );
add_action( 'admin_post_psc2_contact', 'psc2_handle_contact' );

function psc2_handle_callback() {
	if ( ! isset( $_POST['psc2_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['psc2_nonce'] ) ), 'psc2_callback' ) ) {
		psc2_redirect_back( 'cb-error', 'callback-form' );
	}
	$phone = isset( $_POST['phone'] ) ? sanitize_text_field( wp_unslash( $_POST['phone'] ) ) : '';
	if ( strlen( preg_replace( '/\D/', '', $phone ) ) < 10 ) {
		psc2_redirect_back( 'cb-invalid', 'callback-form' );
	}
	$sent = wp_mail( psc2_lead_email(), 'Call-back request', 'Please call me back at ' . $phone );
	psc2_redirect_back( $sent ? 'cb-sent' : 'cb-error', 'callback-form' );
}
add_action( 'admin_post_nopriv_psc2_callback', 'psc2_handle_callback' );
add_action( 'admin_post_psc2_callback', 'psc2_handle_callback' );

/**
 * Status message for a form after the redirect.
 *
 * @param string $form 'contact' or 'callback'.
 * @return array{0:string,1:string} [css class, message]
 */
function psc2_form_status( $form ) {
	$status = isset( $_GET['psc2'] ) ? sanitize_key( wp_unslash( $_GET['psc2'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display only.
	if ( 'contact' === $form ) {
		switch ( $status ) {
			case 'sent':
				return array( 'is-ok', 'Thanks. Your request is in, and a technician will reply by phone or email.' );
			case 'invalid':
				return array( '', 'Some details were missing. Enter your name, email and a 10-digit phone number, then send again.' );
			case 'toobig':
				return array( '', 'That bill file is over 10 MB. Try a smaller scan or a PDF, then send again.' );
			case 'badfile':
				return array( '', 'We can only accept the bill as a PDF, JPG, PNG or HEIC file. Pick another file and send again.' );
			case 'error':
				return array( '', 'The request did not go through. Call 562-489-7760 or email PSC@Pacificsoftcom.com.' );
		}
	}
	if ( 'callback' === $form ) {
		switch ( $status ) {
			case 'cb-sent':
				return array( '', 'Got it. We will call you back.' );
			case 'cb-invalid':
				return array( '', 'Enter a phone number with at least 10 digits.' );
			case 'cb-error':
				return array( '', 'That did not go through. Call us at 562-489-7760.' );
		}
	}
	return array( '', '' );
}
