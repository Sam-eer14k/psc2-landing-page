<?php
/**
 * Fallback template for posts and pages. The landing page itself is front-page.php.
 *
 * @package PSC2
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<main id="main" class="container" style="padding:80px 16px;">
	<p><a href="<?php echo esc_url( home_url( '/' ) ); ?>">&larr; Pacific Softcom</a></p>
	<?php
	if ( have_posts() ) :
		while ( have_posts() ) :
			the_post();
			?>
			<article <?php post_class(); ?> style="margin-top:40px;">
				<h1 class="tp-section-title"><?php the_title(); ?></h1>
				<div style="margin-top:20px;"><?php the_content(); ?></div>
			</article>
			<?php
		endwhile;
	else :
		?>
		<p style="margin-top:40px;">Nothing here yet.</p>
	<?php endif; ?>
</main>
<?php wp_footer(); ?>
</body>
</html>
