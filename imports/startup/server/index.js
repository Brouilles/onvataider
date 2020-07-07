// This defines a starting set of data to be loaded if the app is loaded with an empty db.
import './account';
import './fixtures';

// Set up some rate limiting and other important security settings.
import './security';

// Cron
import './cron';

// API
import '../../api/categories/methods';
import '../../api/common/methods';
import '../../api/pages/methods';
import '../../api/productCategories/methods';
import '../../api/products/methods';
import '../../api/projects/methods';
import '../../api/purchases/methods';
import '../../api/rewards/methods';
import '../../api/users/methods';
