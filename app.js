const mongoose = require("mongoose");
//mongoose.connect('mongodb://root:123456@localhost:27017/Scoped?authSource=admin');
mongoose.connect('mongodb://admin:123456@crowtripper.com:27017/Scoped?authSource=admin'); //crowtripper

const Base64 = require('js-base64').Base64;
const _ = require("lodash");
const async = require("async");
const cheerio = require('cheerio');
const scrapeIt = require("scrape-it");
const Proxie = require("./Proxie");
const StageOne = require("./StageOne");
const StageTwo = require("./StageTwo");
const StageThree = require("./StageThree");
const Place = require("./Place");

var request = require('superagent');

//require('superagent-proxy')(request);

// var idList = [32655, 33116, 45963, 60750, 60763, 60745, 35805, 60795, 60878, 28970]; // 10 USA cities

var stage = 5;

if (stage === 5) {
  StageTwo.find({ placesCollected: false }).exec((error, twos) => {
    var j = 0;

    async.mapLimit(twos, 1, (two, completeTwo) => {
      var i = 0;

      async.mapLimit(two.urls, 1, (url, completeUrl) => {
        Place.findOne({ source: url }).select('source').exec((error, place) => {
          if (place) {
            i++;

            console.log(`Skipped ${url}, progress: ${i}/${two.urls.length}`);

            return completeUrl();
          }

          place = new Place({
            photos: [],
            name: {
              cn: '',
              en: ''
            },
            tags: {
              cn: [],
              en: []
            },
            rating: '5',
            category: 'recreation',
            description: {
              cn: '',
              en: ''
            },
            location: {
              address: {
                cn: '',
                en: ''
              },
              city: {
                cn: '',
                en: ''
              },
              province: {
                cn: '',
                en: ''
              },
              postal: '',
              country: {
                cn: '',
                en: ''
              },
              continent: {
                cn: '',
                en: ''
              },
              coordinates: [-20.0, 15.0]
            },
            phone: '',
            email: '',
            website: '',
            playtime: '2',
            prices: [],
            hours: {
              monday: {
                start: '0:00',
                end: '0:00'
              },
              tuesday: {
                start: '0:00',
                end: '0:00'
              },
              wednesday: {
                start: '0:00',
                end: '0:00'
              },
              thursday: {
                start: '0:00',
                end: '0:00'
              },
              friday: {
                start: '0:00',
                end: '0:00'
              },
              saturday: {
                start: '0:00',
                end: '0:00'
              },
              sunday: {
                start: '0:00',
                end: '0:00'
              }
            },
            source: url
          });

          async.retry({
            times: Number.MAX_VALUE,
            interval: function (retryCount) {
              return 50 * Math.pow(2, retryCount);
            }
          }, (tryComplete, nothing) => {
            Promise.all([
              new Promise((resolve, reject) => {
                var target = `https://www.tripadvisor.cn${url}`;

                request
                  .get(target)
                  .end((err, res) => {
                    if (err || !res.text) {
                      console.log(`fetch error for: ${target}`);
                      return reject(`fetch error for: ${target}`);
                    } else {
                      const $ = cheerio.load(res.text);

                      // name
                      var name = $('#HEADING.heading_title');
                      var english = name.find('.altHead').text();
                      var chinese = '';

                      if (english) {
                        name.find('.altHead').remove();
                        chinese = name.text();
                      } else {
                        english = name.text();
                      }

                      var photoElements = $('[data-prwidget-name="common_centered_image"] img');

                      // photos
                      var photos = [];
                      photoElements.each((i, ele) => {
                        var source = ele.attribs['data-src'] || ele.attribs['src'];

                        if (source.length && !source.includes('x.gif')) {
                          photos.push(source);
                        }
                      });

                      //tags
                      var tagElements = $('.attraction_details .detail a');

                      var tags = [];
                      tagElements.each((i, ele) => {
                        var source = $(ele).text();

                        if (source.length) {
                          tags.push(source);
                        }
                      });

                      var emailExists = $('.blEntry.email')[0];
                      var rawEmail = null;

                      if (emailExists) {
                        rawEmail = emailExists.attribs.onclick.replace(`ta.prwidgets.call('handlers.onEmailClicked', event, this, '`, '').replace("')", "");
                      }
                      var email = '';

                      if (rawEmail && rawEmail.length) {
                        email = Base64.decode(rawEmail);
                      }

                      place.name.en = english;
                      place.name.cn = chinese;
                      place.photos = photos;
                      place.email = email;
                      place.phone = $('.directContactInfo').text();
                      place.rating = $('.overallRating').text().trim();
                      place.tags.cn = tags;
                      place.playtime = $('.detail_section.duration').text();
                      place.description.cn = $('.description .text').text();
                      place.location.address.cn = $($('.address')[0]).text();

                      return resolve();
                    }
                  });
              }),
              new Promise((resolve, reject) => {
                var target = `https://www.tripadvisor.com${url}`;

                request
                  .get(target)
                  .end((err, res) => {
                    if (err || !res.text) {
                      console.log(`fetch error for: ${target}`);
                      return reject(`fetch error for: ${target}`);
                    } else {
                      const $ = cheerio.load(res.text);

                      //tags
                      var tagElements = $('.attraction_details .detail a');

                      var tags = [];
                      tagElements.each((i, ele) => {
                        var source = $(ele).text();

                        if (source.length) {
                          tags.push(source);
                        }
                      });

                      place.tags.en = tags;
                      place.description.en = $('.description .text').text();
                      place.location.address.en = $($('.address')[0]).text();

                      return resolve();
                    }
                  });
              }),
              new Promise((resolve, reject) => {
                var target = `https://www.tripadvisor.cn${url.replace('Attraction_Review-', 'UpdateListing-')}`;

                request
                  .get(target)
                  .end((err, res) => {
                    if (err || !res.text) {
                      console.log(`fetch error for: ${target}`);
                      return reject(`fetch error for: ${target}`);
                    } else {
                      const $ = cheerio.load(res.text);

                      var locs = $('meta[name=location]')[0].attribs['content'].split(';');

                      var parsed = {};

                      var coordinates = [-20.0, 15.0];

                      locs.forEach(loc => {
                        var [key, value] = loc.split('=');

                        if (key === 'coord') {
                          coordinates = value.split(',');
                          coordinates = [parseFloat(coordinates[0]), parseFloat(coordinates[1])];
                        } else {
                          parsed[key] = value;
                        }
                      });

                      for (var key in parsed) {
                        place.location[key].cn = parsed[key];
                      }

                      place.location.coordinates = coordinates;

                      place.website = $('#website').val();

                      place.location.postal = $('#postal').val();

                      var rows = $('.hours table tr:not(.sep)');
                      var hours = {};

                      rows.each((i, row) => {
                        var day = $(row).find('th').text();

                        if (day.includes('一')) {
                          day = 'monday';
                        } else if (day.includes('二')) {
                          day = 'tuesday';
                        } else if (day.includes('三')) {
                          day = 'wednesday';
                        } else if (day.includes('四')) {
                          day = 'thursday';
                        } else if (day.includes('五')) {
                          day = 'friday';
                        } else if (day.includes('六')) {
                          day = 'saturday';
                        } else if (day.includes('日')) {
                          day = 'sunday';
                        }

                        if ($(row).find('.closed').length) {
                          hours[day] = { start: '0:00', end: '0:00' };
                        } else {
                          hours[day] = { start: $($(row).find('td')[0]).text(), end: $($(row).find('td')[2]).text() };
                        }
                      });

                      for (var weekday in hours) {
                        place.hours[weekday] = hours[weekday];
                      }

                      return resolve();
                    }
                  });
              })
            ]).then(() => {
              place.save((error) => {
                if (error) {
                  console.log(error);
                  return tryComplete(error);
                }

                tryComplete();
              });
            }, (error) => {
              tryComplete(error);
            });
          }, (tryError, tryResult) => {
            i++;

            console.log(`Completed URL ${url}, progress: ${i}/${two.urls.length}`);

            return completeUrl();
          });

        });
      }, (error, result) => {
        two.placesCollected = true;
        two.save((error) => {
          j++;

          console.log(`Completed two, progress: ${j}/${twos.length}`);

          completeTwo();
        });
      });
    }, (error, result) => {
      console.log('done');
    });
  });
}

if (stage === 4) {
  console.log('preparing to fetch stagetwos');
  StageTwo.find({ gotLinksForPage: false }).exec((error, twos) => {
    console.log('got stagetwos');
    var j = 0;

    async.mapLimit(twos, 1, (two, completeTwo) => {
      var urls = [];
      var times = [];
      var k = 0;

      for (var i = 0; i < two.amount; i++) {
        times.push(i);
      }

      async.mapLimit(times, 1, (time, completePage) => {
        var target = two.pid.replace('Attractions-', `Attractions-oa${time * 30}-`);

        async.retry({
          times: Number.MAX_VALUE,
          interval: function (retryCount) {
            return 50 * Math.pow(2, retryCount);
          }
        }, (tryComplete, nothing) => {

          //Proxie.find().exec((error, proxies) => {
          //var proxy = proxies[Math.floor(Math.random() * proxies.length)];

          request
            .get(target)
            //.proxy(`http://${proxy.ip}:${proxy.port}`)
            .end((err, res) => {
              if (err || !res.text) {
                console.log(`fetch error for: ${target}`);
                tryComplete(`fetch error for: ${target}`);
              } else {
                const $ = cheerio.load(res.text);

                var links = $('.display_text.ui_button.original').parents('.attraction_element').find('.listing_title a[target="_blank"]');

                urls = urls.concat(_.map(links, link => link.attribs.href));
                k++;
                console.log(`Page ${k}/${times.length}`);

                tryComplete();
              }
            });

          //});

        }, (tryError, tryResult) => {
          completePage();
        });


      }, (errorTwos, resultTwos) => {

        two.urls = _.uniq(urls);
        two.gotLinksForPage = true;

        two.save(error => {
          j++;
          console.log(`All urls are done for: ${two.pid}, length: ${urls.length}, progress: ${j}/${twos.length}`);
          completeTwo();
        });
      });
    }, (errorTwos, resultTwos) => {
      console.log('done');
    });
  });
}

if (stage === 3) {
  StageOne.find({ gotPaginationAmount: false })
    // .skip(process.env.SKIP ? parseInt(process.env.SKIP) : 0)
    // .limit(2)
    .exec((error, ones) => {
      var j = 0;

      // loop through region's IDs
      async.mapLimit(ones, 1, (one, complete) => {

        var i = 0;
        // loop through each city in region
        async.mapLimit(one.urls, 5, (url, complete2) => {
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

          one.gotPaginationAmount = true;

          one.save((error) => {
            console.log(`${j}/${ones.length} stageones complete.`);
            complete();
          });
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
  var idList = _.uniq([659499, 293933, 293959, 293844, 295117, 294245, 294196, 294443, 293943, 293939, 293947, 293949, 293953, 293951, 293931, 293935, 293955, 294190, 293889, 294232, 293961, 293915, 293910, 293963, 293965, 293937, 293967, 294262, 294225, 670819, 293860, 293921, 294211, 186591, 274952, 190410, 294451, 188634, 189952, 274723, 189512, 187275, 294459, 187070, 189896, 188553, 274684, 294453, 274960, 274947, 294457, 190340, 190311, 190405, 190455, 189100, 189806, 188045, 294471, 190372, 274862, 274922, 293969, 294473, 187427, 189398, 274881, 187768, 186216, 294266, 294079, 294479, 294280, 294311, 294071, 291959, 294307, 316040, 294270, 295111, 294073, 291982, 292002, 294077, 294075, 292016, 147237, 153339, 294318, 191, 150768, 294477, 294475, 183815, 294081, 294324, 294064, 294291, 255055, 294115, 294338, 255074, 309679, 294331, 255337, 294121, 294328, 294144, 1487275, 301392, 60665, 294198, 294127, 294131, 294135, 673774, 60716, 294137, 294139, 294141, 295114, 294481, 294143, 60667, 1746897, 294129, 255104, 60666, 293717, 294200, 293790, 293762, 293764, 293766, 293768, 293770, 294437, 293838, 293788, 293774, 293794, 294186, 294188, 293796, 293792, 293786, 293759, 293798, 293800, 293772, 294435, 294206, 294192, 293802, 293804, 293806, 293826, 293828, 293808, 293810, 293812, 293816, 293814, 295116, 294013, 293980, 295416, 294012, 294006, 293986, 297902, 293996, 294005, 294011, 293999, 295424, 294009, 295419, 294008, 294002, 294004, 318895, 298064, 293991, 294010, 298101, 293995, 293983, 294014, 294000, 293998, 293977, 293985, 659499, 293933, 293959, 293844, 295117, 294245, 294196, 294443, 293943, 293939, 293947, 293949, 293953, 293951, 293931, 293935, 293955, 294190, 293889, 294232, 293961, 293915, 293910, 293963, 293965, 293937, 293967, 294262, 294225, 670819, 293860, 293921, 294211, 186591, 274952, 190410, 294451, 188634, 189952, 274723, 189512, 187275, 294459, 187070, 189896, 188553, 274684, 294453, 274960, 274947, 294457, 190340, 190311, 190405, 190455, 189100, 189806, 188045, 294471, 190372, 274862, 274922, 293969, 294473, 187427, 189398, 274881, 187768, 186216, 294266, 294079, 294479, 294280, 294311, 294071, 291959, 294307, 316040, 294270, 295111, 294073, 291982, 292002, 294077, 294075, 292016, 147237, 153339, 294318, 191, 150768, 294477, 294475, 183815, 294081, 294324, 294064, 294291, 255055, 294115, 294338, 255074, 309679, 294331, 255337, 294121, 294328, 294144, 1487275, 301392, 60665, 294198, 294127, 294131, 294135, 673774, 60716, 294137, 294139, 294141, 295114, 294481, 294143, 60667, 1746897, 294129, 255104, 60666, 293717, 294200, 293790, 293762, 293764, 293766, 293768, 293770, 294437, 293838, 293788, 293774, 293794, 294186, 294188, 293796, 293792, 293786, 293759, 293798, 293800, 293772, 294435, 294206, 294192, 293802, 293804, 293806, 293826, 293828, 293808, 293810, 293812, 293816, 293814, 295116, 294013, 293980, 295416, 294012, 294006, 293986, 297902, 293996, 294005, 294011, 293999, 295424, 294009, 295419, 294008, 294002, 294004, 318895, 298064, 293991, 294010, 298101, 293995, 293983, 294014, 294000, 293998, 293977, 293985]);

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

// const http = require('http')
// const port = 8080

// const requestHandler = (request, response) => {
//   console.log(request.url)
//   response.end('Hello Node.js Server!')
// }

// const server = http.createServer(requestHandler)

// server.listen(port, (err) => {
//   if (err) {
//     return console.log('something bad happened', err)
//   }

//   console.log(`server is listening on ${port}`)
// })