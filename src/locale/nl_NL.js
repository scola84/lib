import { HtmlBuilder } from '../worker/html/builder'

const maxlength = 'Deze waarde is te lang (max. %(maxlength)s tekens).'
const required = 'Dit veld is verplicht.'

HtmlBuilder.snippet.misc.Print.addStrings({
  nl_NL: {
    button: {
      back: 'Terug',
      cancel: 'Annuleren',
      delete: 'Verwijderen',
      save: 'Opslaan'
    },
    input: {
      checkbox: {
        required,
        type: 'Deze waarde is niet goed.'
      },
      color: {
        maxlength,
        required,
        type: 'Dit is geen kleur.'
      },
      date: {
        maxlength,
        required,
        max: 'Deze datum is te laat (max. %(max)l[D]).',
        min: 'Deze datum is te vroeg (min. %(min)l[D]).',
        type: 'Dit is geen datum.'
      },
      email: {
        maxlength,
        required,
        domain: 'Dit is geen e-mailadres.',
        local: 'Dit is geen e-mailadres.',
        space: 'Dit is geen e-mailadres.'
      },
      file: {
        maxlength,
        required,
        accept: 'Het bestandstype is niet juist $(accept)s',
        maxsize: 'Het bestand is te groot (max. %(maxsize)n[~s]B)'
      },
      iban: {
        maxlength,
        required,
        type: 'Dit is een geen rekeningnummer.'
      },
      month: {
        maxlength,
        required,
        max: 'Deze maand is te laat (max. %(max)l[D]).',
        min: 'Deze maand is te vroeg (min. %(min)l[D]).',
        type: 'Dit is geen maand.'
      },
      number: {
        maxlength,
        required,
        max: 'Dit getal is te hoog (max. %(max)s).',
        min: 'Dit getal is te laag (min. %(min)s).',
        type: 'Dit is geen getal.'
      },
      password: {
        maxlength,
        required,
        type: 'Dit is geen wachtwoord.'
      },
      radio: {
        required,
        type: 'Deze waarde is niet goed.'
      },
      range: {
        maxlength,
        required,
        max: 'Dit getal is te hoog (max. %(max)s).',
        min: 'Dit getal is te laag (min. %(min)s).',
        type: 'Dit is geen getal.'
      },
      select: {
        maxlength,
        required,
        type: 'Deze waarde is niet goed.'
      },
      tel: {
        maxlength,
        required,
        type: 'Dit is geen telefoonnummer.'
      },
      text: {
        maxlength,
        required,
        type: 'Dit is geen tekst.'
      },
      textarea: {
        maxlength,
        required,
        type: 'Dit is geen tekst.'
      },
      time: {
        maxlength,
        required,
        max: 'Deze tijd is te laat (max. %(max)l[t]).',
        min: 'Deze tijd is te vroeg (max. %(max)l[t]).',
        type: 'Dit is geen tijd.'
      },
      zip: {
        maxlength,
        required,
        type: 'Dit is geen postcode.'
      }
    },
    message: {
      nodata: 'Geen gegevens gevonden.',
      void: 'Selecteer een object'
    },
    search: {
      placeholder: 'Zoeken'
    },
    status: {
      400: 'De gegevens zijn niet juist.',
      404: 'Het pad is niet gevonden.',
      405: 'De bewerking is niet toegestaan.',
      409: 'Er is een conflict opgetreden.',
      413: 'De gegevens zijn te groot.',
      500: 'Er is een serverfout opgetreden.',
      502: 'Er is een verbindingsfout opgetreden.',
      504: 'Er is een verbindingsfout opgetreden.'
    },
    title: {
      actions: 'Acties',
      link: 'Koppelingen',
      properties: 'Eigenschappen'
    }
  }
})
