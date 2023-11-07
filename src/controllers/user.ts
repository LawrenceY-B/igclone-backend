import { NextFunction, Request, Response } from "express";
import User from "../models/user.model";
import Following from "../models/following.model";
import { validateFollow } from "../services/user.service";
import Follower from "../models/follower.model";
import { Schema } from "mongoose";

export const newFollow = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error } = validateFollow(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const { FollowingID } = req.body;
    const UserID = req.user.userID;
    console.log(UserID, FollowingID);
    if (UserID === FollowingID)
      res.status(400).json({ success: true, message: "Can't follow self" });

    const following = await Following.findOne({
      userID: UserID,
      followingID: FollowingID,
    });
    if (!following) {
      //follow the new user
      const following = new Following({
        userID: UserID,
        followingID: FollowingID,
      });
      await following.save();

      //update the other individuals followers list with MongoID
      try {
        const followers = await Follower.findOneAndUpdate(
          {
            userID: FollowingID,
            followerID: UserID,
          },
          { userID: FollowingID, followerID: UserID },
          { new: true, upsert: true }
        );
        // console.log(followers);
      } catch (error) {
        next(error);
      }

      res.status(200).json({ success: true, message: "Following" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "User has already been added" });
    }
  } catch (error) {
    next(error);
  }
};

export const removeFollow = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error } = validateFollow(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const { FollowingID } = req.body;
    const UserID = req.user.userID;
    // console.log(UserID, FollowingID);
    const following = await Following.findOneAndDelete({
      userID: UserID,
      followingID: FollowingID,
    });
    if (!following) {
      return res
        .status(404)
        .json({ success: false, message: "User not in following list." });
    }
    try {
      const followers = await Follower.findOneAndDelete({
        followerID: UserID,
        userID: FollowingID,
      });
      console.log(followers);
    } catch (error) {
      next(error);
    }
    res.status(200).json({ success: true, message: "Not Following" });
  } catch (error) {
    next(error);
  }
};

export const getFollowing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const following = await Following.find({
      userID: req.user.userID,
    })
      .populate({
        path: "followingID",
        options: {
          select: "-EmailVerified", // Exclude fields from the populated document
          sort: { name: -1 },
          strictPopulate: false,
        },
      })
      .select("-_id -__v");
    res.status(200).json({ success: true, following: following });
  } catch (err: any) {
    next(err);  }
};

export const getFollowers = async (req:Request, res:Response, next:NextFunction)=>{
  try {
    const followers = await Follower.find({
      userID: req.user.userID,
    })
      .populate({
        path: "followerID",
        options: {
          select: "-EmailVerified", // Exclude fields from the populated document
          sort: { name: -1 },
          strictPopulate: false,
        },
      })
      .select("-_id -__v");
    res.status(200).json({ success: true, followers: followers });
  } catch (err: any) {
    next(err);
  }
}
