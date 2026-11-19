if (embeddedSlide) {
  $(document).ready(() => {
    skipped = 1;
    newAnimal = animalList.indexOf('oryx');
    document.documentElement.classList.add('embed-initial');
    $('body').removeClass('preloader preloader-layer-2');
    $('.intro-sequence').hide();
    $('.level-one').removeClass('hidden-startup');
    $('.main-nav li:nth-child(3)').addClass('muted');
    nextorprevanimal();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.documentElement.classList.remove('embed-initial');
    }));
    animationstatequestion();
  });
}
