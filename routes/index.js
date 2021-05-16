var express = require('express');
var router = express.Router();

var ctrlRoot = require('../controllers/index');

router.get('/', ctrlRoot.homepage_get);
router.get('/about', ctrlRoot.about_get);
router.get('/contacts', ctrlRoot.contacts_get);
router.get('/engineclean', ctrlRoot.engineclean_get);
router.get('/katalizatorclean', ctrlRoot.katalizatorclean_get);
router.get('/contacts', ctrlRoot.contacts_get);
router.post('/sendorder', ctrlRoot.sendorder_post);

module.exports = router;
