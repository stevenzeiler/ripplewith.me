$(function() {
  _.templateSettings = {
      interpolate: /\{\{\=(.+?)\}\}/g,
      evaluate: /\{\{(.+?)\}\}/g
  };

  var qrCode = new QRCode('qrCode');

  var Balance = Backbone.Model.extend({});
  
  var Payment = Backbone.Model.extend({
    parse: function(data) {
      return data.payment;
    }
  });

  var Balances = Backbone.Collection.extend({
    model: Balance,
    parse: function(response) {
      return response.balances;
    }
  });

  var History = Backbone.Collection.extend({
    model: Payment,
    parse: function(response) {
      return response.payments;
    }
  });

  rippler = (function(Balances, History) {
    var Rippler = Backbone.Model.extend({
      lookup: function(name) {
        this.fetch({
          url: 'https://id.ripple.com/v1/authinfo?username='+name
        });
      },
      fetchHistory: function() {
        return this.history.fetch({
          url: '/v1/accounts/'+this.getRippleAccount()+'/payments'
        })
      },
      fetchBalances: function() {
        return this.balances.fetch({
          url: '/v1/accounts/'+this.getRippleAccount()+'/balances'
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


  var accountHistoryView = (function() {
    var paymentTemplate = _.template($('#paymentTemplate').html());
    var AccountHistoryView = Backbone.View.extend({
      el: '#history',
      render: function() {
        var list = $('<div/>');
        for (var i=0; i<rippler.history.models.length; i++) {
          var payment = rippler.history.models[i];
          list.append(paymentTemplate(payment.toJSON()));
        }
        this.$el.html(list.html());
        this.$el.show();
      }
    });
    return new AccountHistoryView();
  })();


  var accountBalancesView = (function() {
    var balanceTemplate = _.template($('#balanceTemplate').html());
    var AccountBalancesView = Backbone.View.extend({
      el: '#balances',
      render: function() {
        var list = $('<div/>');
        for (var i=0; i<rippler.balances.models.length; i++) {
          var balance = rippler.balances.models[i];
          list.append(balanceTemplate(balance.toJSON()));
        }
        this.$el.html(list.html());
        this.$el.show();
      }
    });
    return new AccountBalancesView();
  })();

  var Router = Backbone.Router.extend({
    routes: {
      ":name": "nameLookup"
    },  
    nameLookup: function(name) {
      rippler.lookup(name);
    }
  });

  var router = new Router;

  var showNameTemplate = _.template($('#nameTemplate').html());

  function showRippler(rippler) {
    $('#centerContainer').html(showNameTemplate(rippler.toJSON()));
    qrCode.makeCode(rippler.get('address'));
    rippler.fetchBalances().complete(accountBalancesView.render.bind(accountBalancesView));
    rippler.fetchHistory().complete(accountHistoryView.render.bind(accountHistoryView));
  }

  $('form').on('submit', handleSubmit);
  $('button').on('click', handleSubmit);
  function handleSubmit(event) {
    event.preventDefault();
    var name = $('input[type="search"]').val();
    router.navigate(name, { trigger: true });
  }

  Backbone.history.start({ pushState: true });

  $('#balancesTitle').on('click', function(event) {
    $('#balances li').toggle();
  });

  $('#historyTitle').on('click', function(event) {
    $('#history li').toggle();
  });

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
