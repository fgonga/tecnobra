import {InfluencerModel} from "../models/influencer.model";
import {BaseCrudService} from "./BaseCrudService";
export class InfluencersService extends BaseCrudService<typeof InfluencerModel> {
  constructor() {
    super(InfluencerModel)
  }
}
