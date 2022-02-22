
import config from '~/core/config';
import validationRouter from '~/core/router'

const router = validationRouter()

router.get('/login', (req, res) => {
    const codePushWebUrl = config.common.codePushWebUrl
    res.redirect(`${codePushWebUrl}/auth/login`);
});

router.get('/register', (req, res) => {
    const codePushWebUrl = config.common.codePushWebUrl
    res.redirect(`${codePushWebUrl}/register`);
});

export default router