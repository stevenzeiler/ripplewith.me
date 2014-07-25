$(function() {
  _.templateSettings = {
      interpolate: /\{\{\=(.+?)\}\}/g,
      evaluate: /\{\{(.+?)\}\}/g
  };

  var qrCode = new QRCode('qrCode');

  var Rippler = Backbone.Model.extend({
    lookup: function(name) {
      var self = this;
      this.fetch({
        url: 'https://id.ripple.com/v1/authinfo?username='+name
      })
    }
  });

  var rippler = new Rippler();

  rippler.on('change:address', function(rippler) {
    console.log('CHANGED!', rippler);
    showRippler(rippler.toJSON());
  })

  var Router = Backbone.Router.extend({
    routes: {
      ":name": "nameLookup",
    },  
    nameLookup: function(name) {
      rippler.lookup(name);
    }
  });

  var router = new Router;

  var showNameTemplate = _.template($('#nameTemplate').html());

  function showRippler(rippler) {
    $('#centerContainer').html(showNameTemplate(rippler));
    qrCode.makeCode(rippler.address);
  }

  function handleSubmit(event) {
    event.preventDefault();
    var name = $('input[type="search"]').val();
    router.navigate(name, { trigger: true });
  }

  $('form').on('submit', handleSubmit);
  $('button').on('click', handleSubmit);

  Backbone.history.start({ pushState: true });
});
