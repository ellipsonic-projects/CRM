import { Router } from "express";
import { OrganizationController } from "./organization.controller";

const router = Router();
const controller = new OrganizationController();

router.post("/", controller.createOrganization);
router.get("/:id", controller.getOrganizationById);

export default router;
