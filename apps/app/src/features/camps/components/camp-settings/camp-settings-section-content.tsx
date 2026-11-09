import type { CampSummary } from '@repo/schema/camps';

import { CampBrandingSection } from '@/features/camps/components/camp-branding-section/camp-branding-section';
import { CampForm } from '@/features/camps/components/camp-form/camp-form';
import type { CampSettingsSection as Section } from '@/features/camps/components/camp-settings/camp-settings-section.constants';
import { ConsentsSection } from '@/features/camps/components/consents-section/consents-section';
import { DiscountCodeSection } from '@/features/camps/components/discount-code-section/discount-code-section';
import { DocumentTypesSection } from '@/features/camps/components/document-types-section/document-types-section';
import { EmailTextsSection } from '@/features/camps/components/email-texts-section/email-texts-section';
import { RegistrationFormSection } from '@/features/camps/components/registration-form-section/registration-form-section';
import { SiblingDiscountSection } from '@/features/camps/components/sibling-discount-section/sibling-discount-section';
import { TurnusSection } from '@/features/camps/components/turnus-section/turnus-section';

interface CampSettingsSectionContentProps {
  section: Section;
  organisationId: string;
  camp: CampSummary;
  canWrite: boolean;
}

// One tab's part of the camp settings.
export function CampSettingsSectionContent({
  section,
  organisationId,
  camp,
  canWrite,
}: CampSettingsSectionContentProps) {
  const props = { organisationId, campId: camp.id, canWrite };

  switch (section) {
    case 'zaklad':
      return <CampForm {...props} />;
    case 'vzhled':
      return <CampBrandingSection {...props} campName={camp.name} />;
    case 'turnusy':
      return <TurnusSection {...props} />;
    case 'formular':
      return <RegistrationFormSection {...props} />;
    case 'emaily':
      return <EmailTextsSection {...props} />;
    case 'slevy':
      return (
        <>
          <SiblingDiscountSection {...props} />
          <DiscountCodeSection {...props} />
        </>
      );
    case 'souhlasy':
      return <ConsentsSection {...props} />;
    case 'dokumenty':
      return <DocumentTypesSection {...props} />;
  }
}
