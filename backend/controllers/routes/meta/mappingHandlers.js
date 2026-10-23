const { createMappingService } = require('../../../services/meta/metaMapping');

function sendMappingError(res, error) {
  if (error && error.name === 'MetaMappingError') {
    return res.status(error.status).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }
  return res.status(500).json({
    success: false,
    code: 'database',
    message: 'The form mapping request could not be completed.',
  });
}

function actorFrom(req) {
  const college = (req.college && req.college._id) || (req.user && req.user.college) || null;
  return {
    userId: req.user && req.user._id ? req.user._id : null,
    collegeId: college,
  };
}

function createMappingHandlers(service) {
  async function listFormMappings(req, res) {
    try {
      const result = await service.listMappings(req.query, actorFrom(req));
      return res.status(200).json(result);
    } catch (error) {
      return sendMappingError(res, error);
    }
  }

  async function unmappedFormMappings(req, res) {
    try {
      const result = await service.unmappedForms(req.query);
      return res.status(200).json(result);
    } catch (error) {
      return sendMappingError(res, error);
    }
  }

  async function formMappingOptions(req, res) {
    try {
      const result = await service.mappingOptions(req.query, actorFrom(req));
      return res.status(200).json(result);
    } catch (error) {
      return sendMappingError(res, error);
    }
  }

  async function createFormMapping(req, res) {
    try {
      const result = await service.createMapping(req.body, actorFrom(req));
      return res.status(201).json(result);
    } catch (error) {
      return sendMappingError(res, error);
    }
  }

  async function getFormMapping(req, res) {
    try {
      const result = await service.getMapping(req.params.id, actorFrom(req));
      return res.status(200).json(result);
    } catch (error) {
      return sendMappingError(res, error);
    }
  }

  async function updateFormMapping(req, res) {
    try {
      const result = await service.updateMapping(req.params.id, req.body, actorFrom(req));
      return res.status(200).json(result);
    } catch (error) {
      return sendMappingError(res, error);
    }
  }

  async function deactivateFormMapping(req, res) {
    try {
      const result = await service.deactivateMapping(req.params.id, actorFrom(req));
      return res.status(200).json(result);
    } catch (error) {
      return sendMappingError(res, error);
    }
  }

  return {
    listFormMappings,
    unmappedFormMappings,
    formMappingOptions,
    createFormMapping,
    getFormMapping,
    updateFormMapping,
    deactivateFormMapping,
  };
}

module.exports = {
  createMappingHandlers,
  ...createMappingHandlers(createMappingService()),
};
