
var Analytics = require('analytics.js-core').constructor;
var integration = require('analytics.js-integration');
var iso = require('to-iso-string');
var sandbox = require('clear-env');
var tester = require('analytics.js-integration-tester');
var Talkable = require('../lib/');

describe('Talkable', function() {
  var analytics;
  var talkable;
  var options = {
    siteId: 'curebit-87ab995d-736b-45ba-ac41-71f4dbb5c74a',
    server: 'https://api.segment.io/track'
  };

  beforeEach(function() {
    analytics = new Analytics();
    talkable = new Talkable(options);
    analytics.use(Talkable);
    analytics.use(tester);
    analytics.add(talkable);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    curebit.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(Talkable, integration('Talkable')
      .global('_curebitq')
      .global('curebit')
      .option('campaigns', {})
      .option('device', '')
      .option('iframeBorder', 0)
      .option('iframeHeight', '480')
      .option('iframeId', 'curebit_integration')
      .option('iframeWidth', '100%')
      .option('insertIntoId', '')
      .option('responsive', true)
      .option('server', 'https://www.curebit.com')
      .option('siteId', '')
      .option('customUrl', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(talkable, 'load');
    });

    describe('#initialize', function() {
      it('should push settings', function() {
        analytics.initialize();
        analytics.deepEqual(window._curebitq, [['init', {
          site_id: options.siteId,
          server: 'https://api.segment.io/track'
        }]]);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.called(talkable.load);
      });
    });
  });

  describe('loading', function() {
    it('should load without custom url', function(done) {
      analytics.load(talkable, done);
    });

    it('should load with custom url', function(done) {
      talkable.options.customUrl = '//d2jjzw81hqbuqv.cloudfront.net/integration/clients/ayr.min.js';
      analytics.load(talkable, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window._curebitq, 'push');
      });

      it('should not register affiliate when the url doesnt match', function() {
        talkable.options.campaigns = { '/share': 'share,test' };
        analytics.page();
        analytics.didNotCall(window._curebitq.push);
      });

      it('should register affiliate when the url matches', function() {
        var campaigns = {};
        campaigns[window.location.pathname] = 'share,test';
        talkable.options.campaigns = campaigns;
        talkable.options.iframeId = 'curebit_integration';
        analytics.page();
        analytics.called(window._curebitq.push, ['register_affiliate', {
          responsive: true,
          device: '',
          campaign_tags: ['share', 'test'],
          iframe: {
            container: '',
            frameborder: 0,
            height: '480',
            id: 'curebit_integration',
            width: '100%'
          }
        }]);
      });

      it('should register affiliate with affiliate member info', function() {
        var campaigns = {};
        campaigns[window.location.pathname] = 'share,test';
        talkable.options.campaigns = campaigns;
        analytics.identify('id', {
          name: 'first last',
          email: 'name@example.com'
        });
        analytics.page();
        analytics.called(window._curebitq.push, ['register_affiliate', {
          responsive: true,
          device: '',
          campaign_tags: ['share', 'test'],
          iframe: {
            container: '',
            frameborder: 0,
            width: '100%',
            id: 'curebit_integration',
            height: '480'
          },
          affiliate_member: {
            email: 'name@example.com',
            first_name: 'first',
            last_name: 'last',
            customer_id: 'id'
          }
        }]);
      });

      it('should throttle', function() {
        window._curebitq = [];
        var campaigns = {};
        campaigns[window.location.pathname] = 'share,test';
        talkable.options.campaigns = campaigns;
        analytics.page();
        analytics.page();
        analytics.page();
        analytics.page();
        analytics.page();
        analytics.equal(window._curebitq.length, 1);
      });
    });

    describe('#completedOrder', function() {
      beforeEach(function() {
        analytics.stub(window._curebitq, 'push');
      });

      it('should send ecommerce data', function() {
        var date = new Date();

        analytics.track('completed order', {
          orderId: 'ab535a52',
          coupon: 'save20',
          date: date,
          total: 647.92,
          products: [{
            sku: '5be59f56',
            quantity: 8,
            price: 80.99,
            name: 'my-product',
            url: '//products.io/my-product',
            image: '//products.io/my-product.webp'
          }]
        });

        analytics.called(window._curebitq.push, ['register_purchase', {
          coupon_code: 'save20',
          customer_id: null,
          email: undefined,
          order_date: iso(date),
          first_name: undefined,
          last_name: undefined,
          order_number: 'ab535a52',
          subtotal: 647.92,
          items: [{
            product_id: '5be59f56',
            quantity: 8,
            price: 80.99,
            title: 'my-product',
            url: '//products.io/my-product',
            image_url: '//products.io/my-product.webp'
          }]
        }]);
      });
    });
  });
});
