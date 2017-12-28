const mongoose = require("mongoose");
//mongoose.connect('mongodb://root:123456@localhost:27017/Crawl?authSource=admin');
mongoose.connect('mongodb://admin:123456@crowtripper.com:27017/Crawl?authSource=admin'); //crowtripper

const _ = require("lodash");
const async = require("async");
const scrapeIt = require("scrape-it");
const StageOne = require("./StageOne");
const StageTwo = require("./StageTwo");

var stage = 3;

if (stage === 4) {
  StageTwo.find({ urls: { $size: 0 } }).exec((error, twos) => {


  });



}

if (stage === 3) {
  StageOne.find().exec((error, ones) => {
    var j = 0;

    // loop through region's IDs
    async.mapLimit(ones, 1, (one, complete) => {

      var i = 0;
      // loop through each city in region
      async.mapLimit(one.urls, 10, (url, complete2) => {
        url = `https://www.tripadvisor.cn${url.replace('/Tourism-', '/Attractions-')}`;

        StageTwo.findOne({ pid: url }).select('pid').exec((error, two) => {
          if (two) {
            // continue if already exists
            i++;
            //console.log(`${url} skipped`);
            return complete2();
          }

          async.retry({
            times: Number.MAX_VALUE,
            interval: function (retryCount) {
              return 50 * Math.pow(2, retryCount);
            }
          }, (tryComplete, nothing) => {

            scrapeIt(url, {
              forbidden: {
                selector: 'h1',
                how: 'html'
              },
              amount: {
                selector: '.pageNumbers',
                convert: (html, $node) => parseInt($node.find('.pageNum.taLnk').last().attr('data-page-number'))
              }
            }).then(page => {
              if (page.forbidden === 'Forbidden') {
                console.log(`Forbidden detected: ${url}`);
                return tryComplete(`Forbidden detected: ${url}`);
              }

              two = new StageTwo();
              two.pid = url;
              two.amount = page.amount || 1;

              two.save((error) => {
                // if (error) {
                //   console.log(`ID failed to save: ${two.pid}`);
                //   return tryComplete();
                // }

                i++;

                console.log(`${i}/${one.urls.length} urls complete.`);
                tryComplete();
              });


            }, error => {
              console.log(`ID failed network: ${url}`);
              tryComplete(`ID failed network: ${url}`);
            });
          }, (tryError, tryResult) => {
            complete2();
          });

        });

      }, (error2, result2) => {
        j++;

        console.log(`${j}/${ones.length} stageones complete.`);
        complete();
      });

    }, (error, result) => {

    });


  });
}

if (stage === 22) {
  StageOne.find().exec((error, amounts) => {

    async.mapLimit(amounts, 1, (amount, complete) => {
      var urls = [];

      async.retry({
        times: Number.MAX_VALUE,
        interval: function (retryCount) {
          return 50 * Math.pow(2, retryCount);
        }
      }, (tryComplete, nothing) => {
        scrapeIt(`https://www.tripadvisor.cn/TourismChildrenAjax?geo=${amount.pid}&offset=${amount.amount - 1}&desktop=true`, {
          urls: {
            listItem: 'a',
            data: {
              url: {
                attr: "href"
              }
            }
          }
        }).then(page => {
          if (_.find(page.urls, url => url.url.includes('mailto:support@tripadvisor.com'))) {
            console.log(`ID failed containing mailto:support@tripadvisor.com: ${amount.pid}`);
            return tryComplete(`ID failed containing mailto:support@tripadvisor.com: ${amount.pid}`);
          }

          console.log(`Offset ${amount.amount - 1} complete.`);

          urls = urls.concat(_.map(page.urls, 'url'));

          tryComplete();
        }, error => {
          console.log(`ID failed: ${amount.pid}`);
          tryComplete(`ID failed: ${amount.pid}`);
        });
      }, (tryError, tryResult) => {
        amount.urls = _.uniq(amount.urls.concat(urls));

        amount.save((error) => {
          console.log(`Saved PID ${amount.pid}`);
          complete();
        });
      });
    }, (error, done2) => {
      console.log('done');
    });

  });
}

if (stage === 2) {
  StageOne.find({ urls: { $exists: false } }).exec((error, amounts) => {

    async.mapLimit(amounts, 1, (amount, complete) => {
      var id = amount.pid;
      var urls = [];
      var times = [];

      for (var i = 0; i < amount.amount; i++) {
        times.push(true);
      }

      var j = 0;

      async.mapLimit(times, 3, (time, complete2) => {
        async.retry({
          times: Number.MAX_VALUE,
          interval: function (retryCount) {
            return 50 * Math.pow(2, retryCount);
          }
        }, (tryComplete, nothing) => {
          scrapeIt(`https://www.tripadvisor.cn/TourismChildrenAjax?geo=${id}&offset=${j}&desktop=true`, {
            urls: {
              listItem: 'a',
              data: {
                url: {
                  attr: "href"
                }
              }
            }
          }).then(page => {
            if (_.find(page.urls, url => url.url.includes('mailto:support@tripadvisor.com'))) {
              console.log(`ID failed containing mailto:support@tripadvisor.com: ${id}`);
              return tryComplete(`ID failed containing mailto:support@tripadvisor.com: ${id}`);
            }

            console.log(`Offset ${j} complete.`);
            j++;

            urls = urls.concat(_.map(page.urls, 'url'));

            tryComplete();
          }, error => {
            console.log(`ID failed: ${id}`);
            tryComplete(`ID failed: ${id}`);
          });
        }, (tryError, tryResult) => {
          complete2();
        });
      }, (error, done2) => {
        amount.urls = urls;

        amount.save((error) => {
          console.log(`Saved PID ${amount.pid}`);
          complete();
        });
      });

    }, (error, done) => {
      console.log('done');
    });
  });
}

if (stage === 1) {
  var idList = _.uniq([2, 4, 8, 293920, 293915, 293916, 293917, 298184, 294232, 298564, 293928, 293921, 298566, 294262, 294265, 294211, 293913, 294225, 297701, 294245, 298465, 187070, 187147, 186216, 186338, 187427, 187497, 187768, 187791, 187514, 274684, 274707, 187849, 187895, 188553, 188590, 188045, 188096, 190410, 190454, 191, 32655, 60763, 45963, 60713, 29222, 153339, 154943, 155019, 154910, 60878, 35805, 60745, 255055, 255060, 255100, 1487275, 60716, 255104, 255122, 255106, 255118, 255337, 612500, 255068, 255069, 3830709, 294012, 295424, 294266, 188634, 291959, 294280, 293939, 189512, 294200, 186217, 294331, 187275, 189398, 294217, 274881, 293860, 186591, 664891, 293951, 293953, 293816, 150768, 293889, 189100, 294459, 186485, 293740, 294196, 293961, 293910, 293969]);

  StageOne.find().exec((error, amounts) => {
    idList = _.filter(idList, (id) => {
      var found = _.find(amounts, amount => {
        return amount.pid === id;
      });

      return !found;
    });

    async.mapLimit(idList, 1, (id, complete) => {
      scrapeIt(`https://www.tripadvisor.cn/TourismChildrenAjax?geo=${id}&offset=999&desktop=true`, {
        amount: {
          selector: 'script',
          how: 'html',
          convert: x => parseInt(x.replace("ta.store('tourism.popularCitiesMaxPage', '", '').replace("');", ''))
        }
      }).then(page => {
        console.log(page.amount);

        StageOne.create({
          pid: id,
          amount: page.amount
        }, (error, result) => {

          console.log(id);
          complete();
        });
      }, error => {
        console.log(`ID failed: ${id}`);
        complete();
      });
    }, (error, done) => {
      console.log('done');
    });
  });
}

const http = require('http')
const port = 8080

const requestHandler = (request, response) => {
  console.log(request.url)
  response.end('Hello Node.js Server!')
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})