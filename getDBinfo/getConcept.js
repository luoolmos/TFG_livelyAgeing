const express = require('express');
const path = require('path');
const pool = require('../db'); 
const app = express();
app.use(express.json());

/**
 * Recupera un concepto de la base de datos PostgreSQL
 */
// Source: running, cycling, swimming, walking, hiking, other
async function getConceptInfoMeasValue(conceptName) {
    try {
        const query = `
        SELECT concept_id, concept_name, vocabulary_id, domain_id
        FROM omop_cdm.concept
        WHERE LOWER(concept_name) = $1
        AND standard_concept = 'S' AND domain_id = 'Meas Value';
        `;
        
        const result = await pool.query(query, [conceptName]);
        
        if (result.rows.length > 0) {
          const conceptId = result.rows[0].concept_id;
          const conceptName = result.rows[0].concept_name;
          const vocabularyId = result.rows[0].vocabulary_id;
          const domainId = result.rows[0].domain_id;
          
          //console.log('ID del concepto:', conceptId);
          //console.log('Nombre del concepto:', conceptName);
          //console.log('Vocabulario:', vocabularyId);
          //console.log('Dominio:', domainId);
          
            return { conceptId, conceptName, vocabularyId, domainId };
        } else {
          console.log('No se encontraron conceptos');
          return null;
        }
      } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        throw error;
      }
}

async function getConceptInfoObservation(conceptName)  {
    try {
        const query = `
        SELECT concept_id, concept_name, vocabulary_id, domain_id
        FROM omop_cdm.concept
        WHERE LOWER(concept_name) = $1
        AND standard_concept = 'S' AND domain_id = 'Observation';
        `;  
        
        const result = await pool.query(query, [conceptName]);
        
        if (result.rows.length > 0) {
            return result.rows;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        throw error;
    }
}

async function getConceptInfoMeasurement(conceptName)  {
  try {
      const query = `
      SELECT concept_id, concept_name, vocabulary_id
      FROM omop_cdm.concept
      WHERE LOWER(concept_name) = $1
      AND standard_concept = 'S' AND domain_id = 'Measurement';
      `;  
      
      const result = await pool.query(query, [conceptName]);
      if (result.rows.length > 0) {
          return result.rows[0];
      } else {
          return null;
      }
  } catch (error) {
      console.error('Error al ejecutar la consulta:', error);
      throw error;
  }
}

async function getConceptUnit(conceptName)  {
  try {
    const query = `
    SELECT concept_id, concept_name, vocabulary_id, domain_id
    FROM omop_cdm.concept
    WHERE LOWER(concept_name) = $1
    AND domain_id = 'Unit';
    `;  
    
    const result = await pool.query(query, [conceptName]);
    
    if (result.rows.length > 0) {
      console.log('result:', result.rows[0]);
      return result.rows[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error al ejecutar la consulta:', error);
    throw error;
  }
}

async function getConceptBiobank(conceptName)  {
  try {
    const query = `
    SELECT concept_id, concept_name, vocabulary_id, domain_id
    FROM omop_cdm.concept
    WHERE LOWER(concept_name) = $1
    AND vocabulary_id = 'UK Biobank' AND domain_id = 'Measurement';
    `;  
    
    const result = await pool.query(query, [conceptName]);
    
    if (result.rows.length > 0) {
      return result.rows;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error al ejecutar la consulta:', error);
    throw error;
  }
}


module.exports = {
  getConceptInfoMeasValue,
  getConceptInfoObservation,
  getConceptInfoMeasurement,
  getConceptUnit
};