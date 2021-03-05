$.fn.lipsumBG = function(rotateText, fadeIn) {
  var canvas = this[0];
  var ctx = canvas.getContext("2d");
  ctx.font = '23px Droid Sans Mono';
  ctx.fillStyle = "rgb(250, 139, 91)";        
  lipsumStr = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc,"
  lipsum = lipsumStr.split(". ")
  redraw = function() {

    generateString = function() {
      var arr = []
      for(var i = 0; i < 8; i++) {
        arr.push(lipsum[Math.floor(Math.random() * lipsum.length)] + ". ")
      }
      return arr.join("")


    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(var y = 0; y < 32; y++) {
      ctx.fillText(generateString(), 10, 0+(23*y))
    }         
  }
  if(fadeIn) {
    var t = this;
    t.addClass("faded-out");
    setTimeout(function() {
      t.addClass("faded-out-trans");
    }, 10); 
    setTimeout(function() {
      t.removeClass("faded-out");
      t.addClass("fade-in");
    }, 20)          
  }
  redraw()
  if(rotateText) {
    window.setInterval(redraw, 1000)
  } 
}

    
