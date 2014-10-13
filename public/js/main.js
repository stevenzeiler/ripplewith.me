$(function() {
  _.templateSettings = {
      interpolate: /\{\{\=(.+?)\}\}/g,
      evaluate: /\{\{(.+?)\}\}/g
  };

  var qrCode = new QRCode('qrCode');

  var Balance = Backbone.Model.extend({});
  
  var Transaction = Backbone.Model.extend({});

  var Balances = Backbone.Collection.extend({
    model: Balance
  });

  var History = Backbone.Collection.extend({
    model: Transaction
  });

  var rippler = (function(Balances, History) {
    var Rippler = Backbone.Model.extend({
      lookup: function(name) {
        this.fetch({
          url: 'https://id.ripple.com/v1/authinfo?username='+name
        });
      },
      fetchHistory: function() {
        this.history.fetch({
          url: 'https://gatewayzen.com/v1/accounts/'+this.getRippleAccount()+'/payments'
        })
      },
      fetchBalances: function() {
        this.balances.fetch({
          url: 'https://gatewayzen.com/v1/accounts/'+this.getRippleAccount()+'/balances'
        })
      },
      getRippleAccount: function() {
        return this.get('address');
      }
    });
    var rippler = new Rippler();
    rippler.balances = new Balances();
    rippler.history = new History();
    return rippler;
  })(Balances, History);

  rippler.on('change:address', showRippler);

  var Router = Backbone.Router.extend({
    routes: {
      ":name": "nameLookup",
      ":name/balances": "accountBalances",
      ":name/history": "accountHistory",
    },  
    nameLookup: function(name) {
      rippler.lookup(name);
    },
    accountBalances: function(account) {
    },
    accountHistory: function(account) {
    }
  });

  var router = new Router;

  var showNameTemplate = _.template($('#nameTemplate').html());

  function showRippler(rippler) {
    console.log('show rippler');
    $('#centerContainer').html(showNameTemplate(rippler.toJSON()));
    qrCode.makeCode(rippler.get('address'));
    rippler.fetchBalances(); 
    rippler.fetchHistory(); 
  }

  $('form').on('submit', handleSubmit);
  $('button').on('click', handleSubmit);
  function handleSubmit(event) {
    event.preventDefault();
    var name = $('input[type="search"]').val();
    router.navigate(name, { trigger: true });
  }

  Backbone.history.start({ pushState: true });

//////////////////////////////////////////////////////
//                  WEBSOCKETS                      // 
//////////////////////////////////////////////////////

  var websocket = new WebSocket('wss://s1.ripple.com');

  websocket.onmessage = function(message) {
    try {
      console.log(JSON.parse(message));
    } catch(error) {
      console.log(message, error);
    }
  }
});
