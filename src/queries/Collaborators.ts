import { Collaborators } from "~/models";
import { sequelize } from "~/db";

export const findByAppNameAndUid = function (uid, appName) {
    var sql = "SELECT b.* FROM `apps` as a left join `collaborators` as b  on (a.id = b.appid) where a.name= :appName and b.uid = :uid and a.`deleted_at` IS NULL and b.`deleted_at` IS NULL limit 0,1";
    return sequelize.query(sql, { replacements: { appName: appName, uid: uid }, model: Collaborators })
        .then(function (data) {
            return data.pop();
        });
};