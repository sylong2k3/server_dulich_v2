const { StatusCodes } = require("./http-status-code");

class SuccessResponse {

    constructor({ message, status = StatusCodes.OK, data = {}, metadata }) {
        this.message = message;
        this.status = status;
        this.data = data;
        if (metadata !== undefined) this.metadata = metadata;
    }

    send(res) {
        return res.status(this.status)
            .json(this)
    }
}

class Ok extends SuccessResponse {
    constructor({ message, data = {}, metadata }) {
        super({ message, status: StatusCodes.OK, data, metadata })
    }
}


class Create extends SuccessResponse {
    constructor({ message, data = {}, metadata }) {
        super({ message, status: StatusCodes.CREATED, data, metadata })
    }
}

const CREATED = (res, message, data, metadata) => {
    new Create({
        message,
        data,
        metadata,
    }).send(res)
}

const OK = (res, message, data, metadata) => {
    new Ok({
        message,
        data,
        metadata,
    }).send(res)
}

/**
 * Build pagination metadata wrapper.
 * @param {{ page, limit, total }} params
 * @returns {{ page, limit, total, totalPages, hasMore }}
 */
const buildPagination = ({ page = 1, limit = 10, total = 0 }) => {
    const p = Number(page) || 1;
    const l = Number(limit) || 10;
    const t = Number(total) || 0;
    const totalPages = l > 0 ? Math.ceil(t / l) : 0;
    return {
        page: p,
        limit: l,
        total: t,
        totalPages,
        hasMore: p < totalPages,
    };
};

/**
 * Trả response danh sách kèm metadata pagination chuẩn hóa.
 * @param {Response} res
 * @param {string} message
 * @param {Array} items - mảng dữ liệu
 * @param {{ page, limit, total }} pagination
 */
const OK_LIST = (res, message, items, pagination) => {
    new Ok({
        message,
        data: { items },
        metadata: { pagination: buildPagination(pagination) },
    }).send(res);
};


module.exports = {
    OK,
    CREATED,
    OK_LIST,
    buildPagination,
}
