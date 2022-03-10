import mongoose, { Mongoose } from 'mongoose';
import userModels from './userModels';
/***********************************
 * schema for creating followers
 ***********************************/
const followSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'userModels' }, // person to follow
    followId: { type: String, required: true }, // logged in user
    followTrackerId: { type: String, unique: true },
  },
  { timestamps: true },
);
export const Follow = mongoose.model('Follow', followSchema);
/***********************************
 * create follow Model
 ***********************************/
export const createFollowModel = async (userId: string, followerId: string) => {
  let newId = userId + followerId;
  const follow = new Follow({
    userId: userId,
    followId: followerId,
    followTrackerId: newId,
  });
  const result = await follow.save();
  return result;
};

/***********************************
 * Method to get all followers
 ***********************************/
export const getFollowersModel = async (userId: string, pageNo: number, pageSize: number) => {
  const followList = await Follow.find({ userId });

  let currentPageSize;

  const userIdArray = followList.map((val) => val['followId']);
  const result = await userModels.find({ _id: { $in: userIdArray } }).select({ _id: 1, email: 1 });
  const resultWithPagno = await userModels
    .find({ _id: { $in: userIdArray } })
    .skip(pageNo - 1)
    .limit(pageSize);

  resultWithPagno.length < 5
    ? (currentPageSize = resultWithPagno.length)
    : (currentPageSize = pageSize);

  const output = {
    Totalfollowers: result.length,
    pageNo,
    pageSize: currentPageSize,
    followers: resultWithPagno,
  };
  return output;
};
/***********************************
 * Method to get all users I follow
 ***********************************/

export const getFollowingModel = async (userId: string, pageNo: number, pageSize: number) => {
  const followList = await Follow.find({ followId: userId });
  // console.log(followList);

  let currentPageSize;

  const userIdArray = followList.map((val) => val['userId']);
  const result = await userModels.find({ _id: { $in: userIdArray } }).select({ _id: 1, email: 1 });
  const resultWithPagno = await userModels
    .find({ _id: { $in: userIdArray } })
    .skip(pageNo - 1)
    .limit(pageSize);
  resultWithPagno.length < 5
    ? (currentPageSize = resultWithPagno.length)
    : (currentPageSize = pageSize);
  const output = {
    Totalfollowing: result.length,
    pageNo,
    pageSize: currentPageSize,
    following: resultWithPagno,
  };
  return output;
};
/***********************************
 * Method to unfollow user
 ***********************************/
export const unFollowModel = async (userId: string, followId: string) => {
  let result = await Follow.deleteOne({ userId, followId });
  return result;
};
/***********************************
 * Method for suggesting followers
 ***********************************/
export const suggestFollowersModel = async (userId: string, pageNo: number, pageSize: number) => {
  let myFollowing = await Follow.find({ followId: userId }).select({ userId: 1 });
  let myFollowingArr = myFollowing.map((item) => item.userId.toString());
  let myFollowingsNetwork: any = await myFollowingsConnection(myFollowingArr);
  let data = await filterConnections(myFollowingArr, myFollowingsNetwork);
  let suggestedConnection = await userModels.find({ _id: { $in: data } });

  return { suggestedConnection, count: suggestedConnection.length };
};
/***********************************
 * Helper method for suggestFollowersModel
 ***********************************/
async function myFollowingsConnection(followingList: any) {
  let data = await Follow.find({ followId: { $in: followingList } });
  let myNetwork = data.map((item) => item.userId.toString());
  return new Promise((resolve, reject) => {
    if (myNetwork) {
      resolve(myNetwork);
    } else {
      resolve('your connections are not folllowing anyone');
    }
  });
}
/***********************************
 * Helper method for suggestFollowersModel
 ***********************************/
async function filterConnections(followingList: Array<string>, connectionList: Array<string>) {
  let ans = connectionList.filter((val) => !followingList.includes(val));
  console.log(ans);
  return new Promise((resolve, reject) => {
    if (ans) {
      resolve(ans);
    } else {
      resolve('no follow suggestion');
    }
  });
}
