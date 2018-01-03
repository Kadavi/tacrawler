//const config = require('../global/config').config;
const mongoose = require('mongoose');
const timestamps = require('mongoose-timestamp');
//const mongoosastic = require('mongoosastic');

const Place = new mongoose.Schema({
  photos: {
    type: Array,
    default: []
  },
  name: {
    cn: {
      type: String,
      default: ''
    },
    en: {
      type: String,
      default: ''
    }
  },
  tags: {
    cn: [{
      type: String,
      default: ''
    }],
    en: [{
      type: String,
      default: ''
    }]
  },
  rating: {
    type: String,
    default: '5'
  },
  category: {
    type: String,
    default: 'recreation'
  },
  description: {
    cn: {
      type: String,
      default: ''
    },
    en: {
      type: String,
      default: ''
    }
  },
  location: {
    address: {
      cn: {
        type: String,
        default: ''
      },
      en: {
        type: String,
        default: ''
      }
    },
    city: {
      cn: {
        type: String,
        default: ''
      },
      en: {
        type: String,
        default: ''
      }
    },
    province: {
      cn: {
        type: String,
        default: ''
      },
      en: {
        type: String,
        default: ''
      }
    },
    postal: {
      type: String,
      default: ''
    },
    country: {
      cn: {
        type: String,
        default: ''
      },
      en: {
        type: String,
        default: ''
      }
    },
    continent: {
      cn: {
        type: String,
        default: ''
      },
      en: {
        type: String,
        default: ''
      }
    },
    coordinates: {
      type: Array,
      index: '2d',
      default: [-20.0, 15.0]
    }
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  playtime: {
    type: String,
    default: ''
  },
  prices: [{
    name: {
      cn: {
        type: String,
        default: ''
      },
      en: {
        type: String,
        default: ''
      }
    },
    amount: {
      type: String,
      default: ''
    }
  }],
  hours: {
    monday: {
      start: {
        type: String,
        default: '0:00'
      },
      end: {
        type: String,
        default: '0:00'
      }
    },
    tuesday: {
      start: {
        type: String,
        default: '0:00'
      },
      end: {
        type: String,
        default: '0:00'
      }
    },
    wednesday: {
      start: {
        type: String,
        default: '0:00'
      },
      end: {
        type: String,
        default: '0:00'
      }
    },
    thursday: {
      start: {
        type: String,
        default: '0:00'
      },
      end: {
        type: String,
        default: '0:00'
      }
    },
    friday: {
      start: {
        type: String,
        default: '0:00'
      },
      end: {
        type: String,
        default: '0:00'
      }
    },
    saturday: {
      start: {
        type: String,
        default: '0:00'
      },
      end: {
        type: String,
        default: '0:00'
      }
    },
    sunday: {
      start: {
        type: String,
        default: '0:00'
      },
      end: {
        type: String,
        default: '0:00'
      }
    }
  },
  source: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  }
});

Place.plugin(timestamps);
// Place.plugin(mongoosastic, {
//   hosts: [config.elastic]
// });

module.exports = mongoose.model('Place', Place);