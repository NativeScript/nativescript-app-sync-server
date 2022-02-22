
import config from '~/core/config';
import validationRouter from '~/core/router'

const router = validationRouter()

router.get('/auth/login', (req, res) => {
    const codePushWebUrl = config.common.webAppUrl
    res.redirect(`${codePushWebUrl}/auth/login`);
});

router.get('/auth/register', (req, res) => {
    const codePushWebUrl = config.common.webAppUrl
    res.redirect(`${codePushWebUrl}/register`);
});

export default router