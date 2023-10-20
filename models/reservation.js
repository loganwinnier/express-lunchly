"use strict";

/** Reservation for Lunchly */

const moment = require("moment");
const { BadRequestError, UnauthorizedError } = require("../expressError");

const db = require("../db");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this._customerId = customerId;
    this._numGuests = numGuests;
    this._startAt = startAt;
    this.notes = notes;
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
      [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }

  /** save this reservation. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at,num_guests, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.startAt, this.numGuests, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
             SET customer_id=$1,
                  start_at=$2
                 num_guests=$3,
                 notes=$4
             WHERE id = $5`, [
        this.customerId,
        this.startAt,
        this.numGuests,
        this.notes,
        this.id,
      ],
      );
    }
  }

  get numGuests() {
    return this._numGuests;
  }

  set numGuests(num) {
    if (num < 1) throw new BadRequestError("Number of guest must be 1 or greater.");

    this._numGuests = num;
  }

  get startAt() {
    return this._startAt;
  }

  set startAt(input) {

    const date = new Date(input);
    console.log("Date=", date, (date));
    if (isNaN(date)) {
      throw new BadRequestError("Must input a date");
    }

    return this._startAt = date;
  }

  get customerId() {
    return this._customerId;
  }

  set customerId(id) {
    throw new UnauthorizedError("Not allowed to change customer id on reservations");
  }
}


module.exports = Reservation;
