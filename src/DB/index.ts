import colors from "colors";
import { User } from "../app/modules/user/user.model";
import config from "../config";
import { USER_ROLES } from "../enums/user";
import { logger } from "../shared/logger";
import { createUniqueReferralId } from "../util/generateRefferalId";

const superUser = {
  firstName: "Super", // put client first name
  lastName: "Admin", // put client last name
  role: USER_ROLES.SUPER_ADMIN,
  email: config.admin.email,
  password: config.admin.password,
  verified: true,
};

const seedSuperAdmin = async () => {
  const isExistSuperAdmin = await User.findOne({
    role: USER_ROLES.SUPER_ADMIN,
  });

  if (!isExistSuperAdmin) {
    const referenceId = await createUniqueReferralId();
    const superUserData = {
      ...superUser,
      referenceId,
    };
    await User.create(superUserData);
    logger.info(colors.green("✔ Super admin created successfully!"));
  }
};

export default seedSuperAdmin;
