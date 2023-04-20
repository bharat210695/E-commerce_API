const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const createError = require("http-errors");
const Cron = require("croner");
const moment = require("moment");
const axios = require("axios");

// const cron = require("node-cron");
// const job = cron.schedule(
//   "30 * * * * *",
//   () => {
//     console.log("job", job);
//     console.log("execute task every 15 minutes between 5 a.m. and 7 a.m.");
//   },
//   { scheduled: true, name: "schedule_bro" }
// );
const SponsoredHistoryModel = require("../../models/sponsoredHistoryModel");
const {
  findOneAndUpdate,
  updateOne,
} = require("../../models/sponsoredHistoryModel");
const sponsoredHistoryModel = require("../../models/sponsoredHistoryModel");
const productModel = require("../../models/productModel");
const {
  sendCronjobFailureMail,
  sendCronjobSuccessMail,
} = require("../../utility/nodeMailerFunction");

// ##################################### GET SPONSOR HISTORY ###############################
const getSponsorHistory = async (req, res, next) => {
  try {
    let { status } = req.query;
    let filterObject = {};
    if (status) {
      filterObject.status = status;
    }
    const sponsorHistoryData = await SponsoredHistoryModel.find(filterObject);
    return res
      .status(200)
      .json({ status: true, message: "Success", data: sponsorHistoryData });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ################################### UPDATE SPONSOR HISTORY STATUS #################################
const updateSponsorStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { sponsorId, status } = req.body;
    let token = req.headers["x-api-key"];

    //check if sponsor data exist
    let sponsorData = await SponsoredHistoryModel.findOne({ _id: sponsorId });
    if (!sponsorData) {
      return next(createError(409, "No Sponsor Data Found!"));
    }

    //If this is an expiry request
    if (status === "expired") {
      console.log("checkpoint if status is expired");
      //update sponsor data status to expired
      let expireSponsor = await sponsoredHistoryModel.updateOne(
        {
          _id: sponsorId,
          // status: "active",
        },
        { $set: { status: "expired" } }
      );

      //if some error occured
      if (expireSponsor.modifiedCount === 0) {
        console.log(
          "checkpoint if sponsor data  update to expired causes some error"
        );

        return next(createError(409, "Could not Expire! Some Error Occured"));
      }
      console.log("checkpoint if sponsor data is updated to expired");

      //update all products in sponsor data sponsored to false
      sponsorData.products.map(async (productId) => {
        await productModel.updateOne(
          {
            _id: productId,
            // sponsored: true,
          },
          {
            $set: {
              sponsored: false,
            },
          }
        );
      });
      console.log(
        "checkpoint if all products in sponsor data have been updated to sponsor false"
      );
      return res.json({ status: true, message: "Expiration Successfull!" });
    }

    //if this is an active or reject request
    else {
      //update sponsor data status to active/rejected
      let updateSponsor = await SponsoredHistoryModel.updateOne(
        { _id: sponsorId }, //status: "pending"
        { $set: { status: status } }
      );

      //if some error occured
      if (updateSponsor.modifiedCount === 0) {
        return next(createError(409, "Some Error Occured!"));
      }

      //if it was active status
      if (status === "active") {
        //update all products in sponsor data sponsored to true
        sponsorData.products.map(async (productId) => {
          await productModel.updateOne(
            {
              _id: productId,
              // sponsored: false,
            },
            {
              $set: {
                sponsored: true,
              },
            }
          );
        });

        //generate sponsor start time (from) and sponsor end time (to)
        let from = moment().format();
        // let to = moment(from).add(10, "s").format();
        let to = moment(from).add(sponsorData.days, "d").format();

        //create cron job to expire the sponsor
        console.log("job created");
        const job = new Cron(to, { maxRuns: 1 }, (job) => {
          //if there is more execution after this (error)
          if (job.next()) {
            return next(createError(409, "Some Error Occured!"));
          }
          // If this is the last execution (success)
          else {
            let url =
              process.env.NODE_ENV === "development"
                ? process.env.LOCAL_CRONJOB_URL
                : process.env.CRONJOB_URL;
            axios
              .patch(
                url,
                {
                  sponsorId: sponsorId,
                  status: "expired",
                },
                {
                  headers: {
                    // "content-type": "application/json",
                    "x-api-key": token,
                  },
                }
              )
              .then(async (response) => {
                if (response.status) {
                  console.log("Successful Cron Job!");
                  await sendCronjobSuccessMail(
                    "optpu666@gmail.com",
                    sponsorData._id
                  );
                } else {
                  console.log(response.message);
                  await sendCronjobFailureMail(
                    "optpu666@gmail.com",
                    response.message,
                    sponsorData._id
                  );
                }
              })
              .catch(async (error) => {
                console.log(error);
                await sendCronjobFailureMail(
                  "optpu666@gmail.com",
                  error,
                  sponsorData._id
                );
              });
          }
        });
      }
      return res.status(200).json({ status: true, message: "Status Updated!" });
    }
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ############################## DELETE SPONSOR BY ID ####################################
const deleteSponsorById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.params;
    const isSponsorExist = await SponsoredHistoryModel.findById({
      _id: id,
    });

    if (isSponsorExist) {
      if (isSponsorExist.status === "active") {
        return next(createError(409, "Can't Delete an Active Sponsor!"));
      } else {
        await SponsoredHistoryModel.deleteOne({ _id: id });
        return res
          .status(200)
          .json({ status: true, message: "Sponsor Deleted" });
      }
    }
    return next(createError(409, "Sponsor Not Found"));
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = {
  getSponsorHistory,
  updateSponsorStatus,
  deleteSponsorById,
};
