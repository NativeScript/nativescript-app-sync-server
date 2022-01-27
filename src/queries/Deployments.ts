import { AppError } from "~/core/app-error";
import { Deployments } from "~/models";
import { sequelize } from "~/db";

export const generateLabelId = function (deploymentId: number) {
    return sequelize.transaction(function (t) {
      return Deployments.findOne({ where: { id: deploymentId }, lock: t.LOCK.UPDATE, transaction: t }).then(function (data) {
        if (!data) {
          throw new AppError("does not find deployment");
        }
  
        data.label_id = data.label_id + 1;
        return data.save({ transaction: t })
          .then(function (data) {
            return data.label_id;
          });
      });
    });
  };
  